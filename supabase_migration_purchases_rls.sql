-- Enable RLS for new tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
CREATE POLICY "Allow authenticated full access to suppliers"
ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to purchase_orders"
ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to purchase_order_items"
ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
