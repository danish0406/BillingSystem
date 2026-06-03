import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Template, Bill, BillItem

class DBManager:
    def __init__(self, db_path="billing.db"):
        self.engine = create_engine(f'sqlite:///{db_path}', echo=False)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self._ensure_default_template()

    def _ensure_default_template(self):
        session = self.Session()
        template = session.query(Template).filter_by(is_default=True).first()
        if not template:
            default_template = Template()
            session.add(default_template)
            session.commit()
        session.close()

    def get_template(self):
        session = self.Session()
        template = session.query(Template).filter_by(is_default=True).first()
        session.close()
        return template

    def update_template(self, data: dict):
        session = self.Session()
        template = session.query(Template).filter_by(is_default=True).first()
        if template:
            for key, value in data.items():
                setattr(template, key, value)
            session.commit()
        session.close()

    def save_bill(self, bill_data: dict, items_data: list) -> Bill:
        session = self.Session()
        # Generate bill number INV-0001
        last_bill = session.query(Bill).order_by(Bill.id.desc()).first()
        next_id = last_bill.id + 1 if last_bill else 1
        bill_number = f"INV-{next_id:04d}"

        new_bill = Bill(
            bill_number=bill_number,
            customer_name=bill_data.get('customer_name'),
            customer_address=bill_data.get('customer_address'),
            customer_phone=bill_data.get('customer_phone'),
            subtotal=bill_data.get('subtotal', 0.0),
            tax_amount=bill_data.get('tax_amount', 0.0),
            discount_amount=bill_data.get('discount_amount', 0.0),
            grand_total=bill_data.get('grand_total', 0.0),
        )
        session.add(new_bill)
        session.flush() # To get the new_bill.id

        for item in items_data:
            bill_item = BillItem(
                bill_id=new_bill.id,
                description=item.get('description'),
                quantity=item.get('quantity'),
                unit_price=item.get('unit_price'),
                amount=item.get('amount')
            )
            session.add(bill_item)

        session.commit()
        session.refresh(new_bill) # ensure relationship items are loaded
        # Note: items might not be eagerly loaded after close. We might need them, so we'll detach or just recreate.
        
        # To avoid DetachedInstanceError, we create a disconnected dict or copy of the bill before closing
        bill_copy = {
            'id': new_bill.id,
            'bill_number': new_bill.bill_number,
            'date_time': new_bill.date_time,
            'customer_name': new_bill.customer_name,
            'customer_address': new_bill.customer_address,
            'customer_phone': new_bill.customer_phone,
            'subtotal': new_bill.subtotal,
            'tax_amount': new_bill.tax_amount,
            'discount_amount': new_bill.discount_amount,
            'grand_total': new_bill.grand_total,
            'items': [
                {
                    'description': i.description,
                    'quantity': i.quantity,
                    'unit_price': i.unit_price,
                    'amount': i.amount
                } for i in new_bill.items
            ]
        }
        
        session.close()
        return bill_copy

    def get_all_bills(self, search_query=""):
        session = self.Session()
        query = session.query(Bill)
        if search_query:
            query = query.filter(
                (Bill.bill_number.ilike(f"%{search_query}%")) |
                (Bill.customer_name.ilike(f"%{search_query}%"))
            )
        bills = query.order_by(Bill.date_time.desc()).all()
        
        result = []
        for bill in bills:
            result.append({
                'id': bill.id,
                'bill_number': bill.bill_number,
                'date_time': bill.date_time,
                'customer_name': bill.customer_name,
                'grand_total': bill.grand_total,
            })
        session.close()
        return result

    def get_bill_by_id(self, bill_id):
        session = self.Session()
        bill = session.query(Bill).filter_by(id=bill_id).first()
        if not bill:
            session.close()
            return None
            
        bill_copy = {
            'id': bill.id,
            'bill_number': bill.bill_number,
            'date_time': bill.date_time,
            'customer_name': bill.customer_name,
            'customer_address': bill.customer_address,
            'customer_phone': bill.customer_phone,
            'subtotal': bill.subtotal,
            'tax_amount': bill.tax_amount,
            'discount_amount': bill.discount_amount,
            'grand_total': bill.grand_total,
            'items': [
                {
                    'description': i.description,
                    'quantity': i.quantity,
                    'unit_price': i.unit_price,
                    'amount': i.amount
                } for i in bill.items
            ]
        }
        session.close()
        return bill_copy
