const PrintPreview = ({ bill, template }) => {
  if (!bill || !template) return null;
  const isNewStyle = bill.items && bill.items.length > 0 && ('name' in bill.items[0]);

  return (
    <div className="receipt-preview">
      <div className="receipt-header">
        <h2>{template.business_name || 'RECEIPT'}</h2>
        <div>{template.business_address || ''}</div>
        <div>{template.business_contact || ''}</div>
      </div>
      
      <div className="receipt-line"></div>
      
      {isNewStyle ? (
        <>
          {bill.items.map((field, idx) => {
            let val = field.value;
            if (field.name === 'Reg No' && (!val || val === '-')) {
              val = String(bill.bill_number);
            }
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{field.name}:</span>
                <span style={{ textAlign: 'right', fontWeight: '500' }}>{val || '-'}</span>
              </div>
            );
          })}
          <div className="receipt-line"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>Total:</span>
            <span>{template.currency} {Number(bill.grand_total).toFixed(2)}</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Bill No:</span>
            <span>{bill.bill_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Date:</span>
            <span>{new Date(bill.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Customer:</span>
            <span>{bill.customer_name || 'Cash'}</span>
          </div>

          <div className="receipt-line"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span style={{ width: '40%' }}>Item</span>
            <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
            <span style={{ width: '20%', textAlign: 'right' }}>Price</span>
            <span style={{ width: '25%', textAlign: 'right' }}>Amt</span>
          </div>
          
          {bill.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ width: '40%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.description}
              </span>
              <span style={{ width: '15%', textAlign: 'right' }}>{item.quantity}</span>
              <span style={{ width: '20%', textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</span>
              <span style={{ width: '25%', textAlign: 'right' }}>{Number(item.amount).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="receipt-line"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Subtotal:</span>
            <span>{template.currency} {Number(bill.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Tax:</span>
            <span>{template.currency} {Number(bill.tax_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Discount:</span>
            <span>{template.currency} {Number(bill.discount_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>Total:</span>
            <span>{template.currency} {Number(bill.grand_total).toFixed(2)}</span>
          </div>
        </>
      )}

      <div className="receipt-line"></div>
      
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        {template.footer_notes || 'Thank You!'}
      </div>
    </div>
  );
};

export default PrintPreview;
