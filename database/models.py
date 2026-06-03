from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Template(Base):
    __tablename__ = 'templates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String, default="Your Company Name")
    company_address = Column(String, default="123 Business Street\nCity, State 12345")
    phone = Column(String, default="(555) 123-4567")
    email = Column(String, default="info@yourcompany.com")
    footer_text = Column(String, default="Thank you for your business!\nGoods once sold are not returnable.")
    tax_rate = Column(Float, default=0.0)
    is_default = Column(Boolean, default=True)

class Bill(Base):
    __tablename__ = 'bills'
    id = Column(Integer, primary_key=True, autoincrement=True)
    bill_number = Column(String, unique=True, index=True) # e.g. "INV-0001"
    date_time = Column(DateTime, default=datetime.now)
    customer_name = Column(String, nullable=True)
    customer_address = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = 'bill_items'
    id = Column(Integer, primary_key=True, autoincrement=True)
    bill_id = Column(Integer, ForeignKey('bills.id'))
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    
    bill = relationship("Bill", back_populates="items")
