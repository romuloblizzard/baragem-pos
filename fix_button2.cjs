const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// The button currently calls submitOrder directly, we need to change it
content = content.replace(
  "onClick={submitOrder}\n              disabled={isSubmittingOrder || cart.length === 0}",
  "onClick={() => setShowCartConfirmModal(true)}\n              disabled={isSubmittingOrder || cart.length === 0}"
);

fs.writeFileSync(file, content);
console.log("Updated Enviar Pedido button to show the modal!");
