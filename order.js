// ESSYTEL Order Page JavaScript - 3D Menu, Cart System, and M-Pesa Payment

let menuScene, menuCamera, menuRenderer;
let menuItems3D = [];
let cart = [];
let currentCategory = 'all';
let currentOrder = null;

// Sample menu data (would come from backend in real app)
const menuData = {
    appetizers: [
        { id: 1, name: 'Samosas', price: 150, description: 'Crispy pastries filled with spiced vegetables', emoji: '🥟', category: 'appetizers' },
        { id: 2, name: 'Chicken Wings', price: 350, description: 'Spicy grilled chicken wings with sauce', emoji: '🍗', category: 'appetizers' }
    ],
    mains: [
        { id: 3, name: 'Nyama Choma', price: 800, description: 'Traditional grilled meat with ugali', emoji: '🥩', category: 'mains' },
        { id: 4, name: 'Fish & Chips', price: 650, description: 'Fresh fish with crispy chips', emoji: '🍟', category: 'mains' },
        { id: 5, name: 'Chicken Curry', price: 700, description: 'Spiced chicken curry with rice', emoji: '🍛', category: 'mains' }
    ],
    drinks: [
        { id: 6, name: 'Tusker Beer', price: 200, description: 'Cold local beer', emoji: '🍺', category: 'drinks' },
        { id: 7, name: 'Wine Glass', price: 450, description: 'Premium red wine', emoji: '🍷', category: 'drinks' },
        { id: 8, name: 'Fresh Juice', price: 180, description: 'Freshly squeezed orange juice', emoji: '🧃', category: 'drinks' }
    ],
    desserts: [
        { id: 9, name: 'Chocolate Cake', price: 300, description: 'Rich chocolate layer cake', emoji: '🍰', category: 'desserts' },
        { id: 10, name: 'Ice Cream', price: 200, description: 'Vanilla ice cream with toppings', emoji: '🍨', category: 'desserts' }
    ]
};

// Initialize 3D menu scene
function initMenuScene() {
    const container = document.getElementById('menu-scene');
    if (!container) return;

    // Scene setup
    menuScene = new THREE.Scene();
    menuScene.background = new THREE.Color(0xF7F4F4);

    // Camera setup
    menuCamera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    menuCamera.position.set(0, 3, 6);

    // Renderer setup
    menuRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    menuRenderer.setSize(container.offsetWidth, container.offsetHeight);
    menuRenderer.shadowMap.enabled = true;
    container.appendChild(menuRenderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    menuScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    menuScene.add(directionalLight);

    // Create 3D menu items
    create3DMenuItems();

    // Start animation
    animateMenuScene();

    // Handle resize
    window.addEventListener('resize', onMenuSceneResize);
}

function create3DMenuItems() {
    const allItems = Object.values(menuData).flat();
    const radius = 4;

    allItems.forEach((item, index) => {
        const angle = (index / allItems.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Create a simple 3D representation
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshLambertMaterial({ 
            color: getItemColor(item.category) 
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(x, 0, z);
        mesh.userData = item;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        menuItems3D.push(mesh);
        menuScene.add(mesh);

        // Add hover effect
        mesh.callback = () => highlightItem(item);
    });
}

function getItemColor(category) {
    const colors = {
        appetizers: 0xFF6B6B,
        mains: 0x4ECDC4,
        drinks: 0x552834,
        desserts: 0xFFE66D
    };
    return colors[category] || 0x999999;
}

function animateMenuScene() {
    requestAnimationFrame(animateMenuScene);

    // Rotate menu items
    menuItems3D.forEach((item, index) => {
        const time = Date.now() * 0.001;
        item.position.y = Math.sin(time + index) * 0.2;
        item.rotation.x += 0.005;
        item.rotation.y += 0.01;
    });

    // Slowly rotate camera around the menu
    const time = Date.now() * 0.0005;
    menuCamera.position.x = Math.cos(time) * 6;
    menuCamera.position.z = Math.sin(time) * 6;
    menuCamera.lookAt(0, 0, 0);

    menuRenderer.render(menuScene, menuCamera);
}

function onMenuSceneResize() {
    const container = document.getElementById('menu-scene');
    if (!container) return;

    menuCamera.aspect = container.offsetWidth / container.offsetHeight;
    menuCamera.updateProjectionMatrix();
    menuRenderer.setSize(container.offsetWidth, container.offsetHeight);
}

// Scene control functions
function rotateScene(direction) {
    const rotationSpeed = 0.5;
    menuItems3D.forEach(item => {
        const currentRotation = item.rotation.y;
        item.rotation.y = direction === 'left' ? 
            currentRotation + rotationSpeed : 
            currentRotation - rotationSpeed;
    });
    
    showAIResponse("Let me show you more delicious options! 🔄");
}

function resetView() {
    menuItems3D.forEach((item, index) => {
        const angle = (index / menuItems3D.length) * Math.PI * 2;
        const radius = 4;
        item.position.x = Math.cos(angle) * radius;
        item.position.z = Math.sin(angle) * radius;
        item.rotation.set(0, 0, 0);
    });
    
    menuCamera.position.set(0, 3, 6);
    showAIResponse("Perfect! Here's your full menu view. What catches your eye? 👀");
}

// Menu management
function loadMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    menuGrid.innerHTML = '';

    const itemsToShow = currentCategory === 'all' ? 
        Object.values(menuData).flat() : 
        menuData[currentCategory] || [];

    itemsToShow.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <div class="menu-item-image">
                <span style="font-size: 4rem;">${item.emoji}</span>
            </div>
            <div class="menu-item-content">
                <h3 class="menu-item-name">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">KSH ${item.price}</span>
                    <button class="add-to-cart" onclick="addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        itemCard.addEventListener('click', () => highlightItem(item));
        menuGrid.appendChild(itemCard);
    });
}

function showCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload menu items
    loadMenuItems();
    
    // AI response
    const categoryMessages = {
        all: "Here's our complete menu! What would you like to try? 🍽️",
        appetizers: "Great choice! These appetizers will start your meal perfectly! 🥟",
        mains: "Excellent! Our main courses are chef's specialties! 🍛",
        drinks: "Perfect! Let me show you our beverage selection! 🍷",
        desserts: "Sweet choice! Our desserts are the perfect ending! 🍰"
    };
    
    showAIResponse(categoryMessages[category] || "Let me show you these delicious options!");
}

// Cart management
function addToCart(itemId) {
    const allItems = Object.values(menuData).flat();
    const item = allItems.find(i => i.id === itemId);
    
    if (!item) return;

    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartDisplay();
    
    // AI responses
    const responses = [
        `Excellent choice! ${item.name} added to your order. 😊`,
        `Great taste! ${item.name} is one of our favorites! ⭐`,
        `Perfect! ${item.name} is now in your cart. Anything else? 🛒`,
        `Wonderful selection! ${item.name} will be delicious! 🤤`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    showAIResponse(randomResponse);
}

function removeFromCart(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        updateCartDisplay();
        showAIResponse("No problem! I've updated your order. 👍");
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">KSH ${item.price} x ${item.quantity}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="removeFromCart(${item.id})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="addToCart(${item.id})">+</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('open');
}

function placeOrder() {
    if (cart.length === 0) {
        showAIResponse("Your cart is empty! Please add some delicious items first. 🛒");
        return;
    }

    // Show phone number input modal
    showPhoneModal();
}

function showPhoneModal() {
    const modal = document.createElement('div');
    modal.className = 'modal phone-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Enter Your Phone Number</h3>
            <p>We'll send an M-Pesa payment request to complete your order</p>
            <div class="form-group">
                <label for="customer-phone">Phone Number (M-Pesa)</label>
                <input type="tel" id="customer-phone" placeholder="0712345678 or 254712345678" required>
                <small>Enter your M-Pesa registered phone number</small>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="closePhoneModal()">Cancel</button>
                <button class="btn btn-primary" onclick="processOrder()">Continue with M-Pesa</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
    
    // Focus on phone input
    document.getElementById('customer-phone').focus();
}

function closePhoneModal() {
    const modal = document.querySelector('.phone-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

async function processOrder() {
    const phoneInput = document.getElementById('customer-phone');
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
        showAIResponse("Please enter your phone number to continue. 📱");
        return;
    }
    
    // Validate phone number format
    const phoneRegex = /^(0|254)?[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
        showAIResponse("Please enter a valid Kenyan phone number (e.g., 0712345678). 📱");
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        closePhoneModal();
        showLoadingModal("Processing your order...");
        
        // Create order first
        const orderData = {
            items: cart,
            total: total,
            table_number: document.getElementById('table-number').textContent,
            phone: phoneNumber,
            timestamp: new Date().toISOString()
        };
        
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const orderResult = await orderResponse.json();
        
        if (orderResult.success) {
            currentOrder = orderResult;
            
            // Initiate M-Pesa payment
            const paymentData = {
                order_id: orderResult.order_id,
                phone_number: phoneNumber,
                amount: total
            };
            
            updateLoadingModal("Initiating M-Pesa payment...");
            
            const paymentResponse = await fetch('/api/mpesa/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            const paymentResult = await paymentResponse.json();
            
            if (paymentResult.success) {
                closeLoadingModal();
                showMpesaModal(paymentResult, orderResult.order_id);
                
                // Start checking payment status
                startPaymentStatusCheck(orderResult.order_id);
            } else {
                closeLoadingModal();
                showAIResponse(paymentResult.message || "Failed to initiate M-Pesa payment. Please try again. 😔");
            }
        } else {
            closeLoadingModal();
            showAIResponse(orderResult.message || "Failed to create order. Please try again. 😔");
        }
        
    } catch (error) {
        console.error('Order processing error:', error);
        closeLoadingModal();
        showAIResponse("Sorry, there was an issue processing your order. Please try again. 😅");
    }
}

function showLoadingModal(message) {
    let modal = document.querySelector('.loading-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal loading-modal';
        modal.innerHTML = `
            <div class="modal-content loading-content">
                <div class="loading-spinner"></div>
                <h3 id="loading-message">${message}</h3>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('loading-message').textContent = message;
    }
    
    setTimeout(() => modal.classList.add('show'), 100);
}

function updateLoadingModal(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

function closeLoadingModal() {
    const modal = document.querySelector('.loading-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function showMpesaModal(paymentResult, orderId) {
    const modal = document.createElement('div');
    modal.className = 'modal mpesa-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="mpesa-header">
                <div class="mpesa-logo">📱</div>
                <h3>M-Pesa Payment</h3>
            </div>
            <div class="mpesa-instructions">
                <p>✅ Payment request sent to your phone!</p>
                <p>📱 Check your phone for the M-Pesa prompt</p>
                <p>🔢 Enter your M-Pesa PIN to complete payment</p>
                <div class="order-summary">
                    <p>Order Total: <strong>KSH ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</strong></p>
                </div>
            </div>
            <div class="payment-status" id="payment-status">
                <div class="status-indicator pending">⏳ Waiting for payment...</div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="cancelPayment('${orderId}')">Cancel</button>
                <button class="btn btn-primary" onclick="checkPaymentManually('${orderId}')">Check Status</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 100);
}

function startPaymentStatusCheck(orderId) {
    const checkInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/payments/${orderId}`);
            const result = await response.json();
            
            if (result.success) {
                const payment = result.payment;
                const statusIndicator = document.querySelector('.status-indicator');
                
                if (payment.status === 'completed') {
                    clearInterval(checkInterval);
                    
                    if (statusIndicator) {
                        statusIndicator.className = 'status-indicator success';
                        statusIndicator.textContent = '✅ Payment successful!';
                    }
                    
                    setTimeout(() => {
                        closeMpesaModal();
                        showOrderConfirmation(currentOrder);
                        
                        // Clear cart
                        cart = [];
                        updateCartDisplay();
                        toggleCart();
                    }, 2000);
                    
                } else if (payment.status === 'failed') {
                    clearInterval(checkInterval);
                    
                    if (statusIndicator) {
                        statusIndicator.className = 'status-indicator failed';
                        statusIndicator.textContent = '❌ Payment failed';
                    }
                    
                    setTimeout(() => {
                        closeMpesaModal();
                        showAIResponse(generate_polite_response("payment_failed"));
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Payment status check error:', error);
        }
    }, 3000); // Check every 3 seconds
    
    // Stop checking after 5 minutes
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 300000);
}

async function checkPaymentManually(orderId) {
    try {
        const response = await fetch(`/api/payments/${orderId}`);
        const result = await response.json();
        
        if (result.success) {
            const payment = result.payment;
            const statusIndicator = document.querySelector('.status-indicator');
            
            if (payment.status === 'completed') {
                statusIndicator.className = 'status-indicator success';
                statusIndicator.textContent = '✅ Payment successful!';
                
                setTimeout(() => {
                    closeMpesaModal();
                    showOrderConfirmation(currentOrder);
                    
                    // Clear cart
                    cart = [];
                    updateCartDisplay();
                    toggleCart();
                }, 1500);
                
            } else if (payment.status === 'failed') {
                statusIndicator.className = 'status-indicator failed';
                statusIndicator.textContent = '❌ Payment failed';
                
            } else {
                showAIResponse("Payment is still pending. Please complete the M-Pesa prompt on your phone. 📱");
            }
        }
    } catch (error) {
        console.error('Manual payment check error:', error);
        showAIResponse("Unable to check payment status. Please try again. 😅");
    }
}

function cancelPayment(orderId) {
    closeMpesaModal();
    showAIResponse("Payment cancelled. Your cart is still available if you'd like to try again. 🛒");
}

function closeMpesaModal() {
    const modal = document.querySelector('.mpesa-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function showOrderConfirmation(orderData) {
    const modal = document.getElementById('order-modal');
    const message = document.getElementById('order-confirmation-message');
    
    const confirmationMessages = [
        `🎉 Payment successful! Your order is confirmed and being prepared.`,
        `✨ Thank you! Payment received. Your delicious meal is on the way!`,
        `👨‍🍳 Perfect! Payment complete. Our chef is already working on your order!`,
        `🍽️ Excellent! Your meal will be ready in 15-20 minutes!`
    ];
    
    const randomMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
    message.textContent = randomMessage;
    
    modal.classList.add('show');
}

// AI response system
function showAIResponse(message) {
    const aiResponse = document.getElementById('ai-response');
    const aiMessage = aiResponse.querySelector('p');
    
    aiMessage.textContent = message;
    
    // Add animation
    aiResponse.style.transform = 'scale(1.02)';
    setTimeout(() => {
        aiResponse.style.transform = 'scale(1)';
    }, 200);
}

function highlightItem(item) {
    const responses = [
        `${item.name} - ${item.description} for just KSH ${item.price}! 😋`,
        `Great choice! ${item.name} is very popular with our guests! ⭐`,
        `${item.name} sounds perfect! ${item.description} 🤤`,
        `Excellent taste! ${item.name} is one of our chef's specialties! 👨‍🍳`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    showAIResponse(randomResponse);
}

// Backend communication (simulated)
async function sendOrderToBackend(orderData) {
    try {
        // Simulate API call
        console.log('Sending order to backend:', orderData);
        
        // In real app, this would be:
        // const response = await fetch('/api/orders', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(orderData)
        // });
        
        // Simulate successful response
        setTimeout(() => {
            showAIResponse("Your order has been confirmed! Thank you for choosing ESSYTEL! 🎉");
        }, 1000);
        
    } catch (error) {
        console.error('Error sending order:', error);
        showAIResponse("Sorry, there was an issue with your order. Please try again. 😅");
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('ESSYTEL Order Page with M-Pesa Loaded');
    
    // Initialize 3D scene
    setTimeout(initMenuScene, 100);
    
    // Load menu items
    loadMenuItems();
    
    // Initialize cart display
    updateCartDisplay();
    
    // Welcome message
    setTimeout(() => {
        showAIResponse("Welcome! I'm here to help you order. Browse our 3D menu and pay securely with M-Pesa! 🍽️💳");
    }, 1000);
    
    // Set random table number
    const tableNumber = Math.floor(Math.random() * 20) + 1;
    document.getElementById('table-number').textContent = tableNumber;
});

// Make functions globally available
window.showCategory = showCategory;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.placeOrder = placeOrder;
window.closeModal = closeModal;
window.rotateScene = rotateScene;
window.resetView = resetView;
window.closePhoneModal = closePhoneModal;
window.processOrder = processOrder;
window.checkPaymentManually = checkPaymentManually;
window.cancelPayment = cancelPayment;





// // ESSYTEL Order Page JavaScript - 3D Menu and Cart System

// let menuScene, menuCamera, menuRenderer;
// let menuItems3D = [];
// let cart = [];
// let currentCategory = 'all';

// // Sample menu data (would come from backend in real app)
// const menuData = {
//     appetizers: [
//         { id: 1, name: 'Samosas', price: 150, description: 'Crispy pastries filled with spiced vegetables', emoji: '🥟', category: 'appetizers' },
//         { id: 2, name: 'Chicken Wings', price: 350, description: 'Spicy grilled chicken wings with sauce', emoji: '🍗', category: 'appetizers' }
//     ],
//     mains: [
//         { id: 3, name: 'Nyama Choma', price: 800, description: 'Traditional grilled meat with ugali', emoji: '🥩', category: 'mains' },
//         { id: 4, name: 'Fish & Chips', price: 650, description: 'Fresh fish with crispy chips', emoji: '🍟', category: 'mains' },
//         { id: 5, name: 'Chicken Curry', price: 700, description: 'Spiced chicken curry with rice', emoji: '🍛', category: 'mains' }
//     ],
//     drinks: [
//         { id: 6, name: 'Tusker Beer', price: 200, description: 'Cold local beer', emoji: '🍺', category: 'drinks' },
//         { id: 7, name: 'Wine Glass', price: 450, description: 'Premium red wine', emoji: '🍷', category: 'drinks' },
//         { id: 8, name: 'Fresh Juice', price: 180, description: 'Freshly squeezed orange juice', emoji: '🧃', category: 'drinks' }
//     ],
//     desserts: [
//         { id: 9, name: 'Chocolate Cake', price: 300, description: 'Rich chocolate layer cake', emoji: '🍰', category: 'desserts' },
//         { id: 10, name: 'Ice Cream', price: 200, description: 'Vanilla ice cream with toppings', emoji: '🍨', category: 'desserts' }
//     ]
// };

// // Initialize 3D menu scene
// function initMenuScene() {
//     const container = document.getElementById('menu-scene');
//     if (!container) return;

//     // Scene setup
//     menuScene = new THREE.Scene();
//     menuScene.background = new THREE.Color(0xF7F4F4);

//     // Camera setup
//     menuCamera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
//     menuCamera.position.set(0, 3, 6);

//     // Renderer setup
//     menuRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     menuRenderer.setSize(container.offsetWidth, container.offsetHeight);
//     menuRenderer.shadowMap.enabled = true;
//     container.appendChild(menuRenderer.domElement);

//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
//     menuScene.add(ambientLight);

//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//     directionalLight.position.set(5, 10, 5);
//     directionalLight.castShadow = true;
//     menuScene.add(directionalLight);

//     // Create 3D menu items
//     create3DMenuItems();

//     // Start animation
//     animateMenuScene();

//     // Handle resize
//     window.addEventListener('resize', onMenuSceneResize);
// }

// function create3DMenuItems() {
//     const allItems = Object.values(menuData).flat();
//     const radius = 4;

//     allItems.forEach((item, index) => {
//         const angle = (index / allItems.length) * Math.PI * 2;
//         const x = Math.cos(angle) * radius;
//         const z = Math.sin(angle) * radius;

//         // Create a simple 3D representation
//         const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
//         const material = new THREE.MeshLambertMaterial({ 
//             color: getItemColor(item.category) 
//         });
//         const mesh = new THREE.Mesh(geometry, material);
        
//         mesh.position.set(x, 0, z);
//         mesh.userData = item;
//         mesh.castShadow = true;
//         mesh.receiveShadow = true;
        
//         menuItems3D.push(mesh);
//         menuScene.add(mesh);

//         // Add hover effect
//         mesh.callback = () => highlightItem(item);
//     });
// }

// function getItemColor(category) {
//     const colors = {
//         appetizers: 0xFF6B6B,
//         mains: 0x4ECDC4,
//         drinks: 0x552834,
//         desserts: 0xFFE66D
//     };
//     return colors[category] || 0x999999;
// }

// function animateMenuScene() {
//     requestAnimationFrame(animateMenuScene);

//     // Rotate menu items
//     menuItems3D.forEach((item, index) => {
//         const time = Date.now() * 0.001;
//         item.position.y = Math.sin(time + index) * 0.2;
//         item.rotation.x += 0.005;
//         item.rotation.y += 0.01;
//     });

//     // Slowly rotate camera around the menu
//     const time = Date.now() * 0.0005;
//     menuCamera.position.x = Math.cos(time) * 6;
//     menuCamera.position.z = Math.sin(time) * 6;
//     menuCamera.lookAt(0, 0, 0);

//     menuRenderer.render(menuScene, menuCamera);
// }

// function onMenuSceneResize() {
//     const container = document.getElementById('menu-scene');
//     if (!container) return;

//     menuCamera.aspect = container.offsetWidth / container.offsetHeight;
//     menuCamera.updateProjectionMatrix();
//     menuRenderer.setSize(container.offsetWidth, container.offsetHeight);
// }

// // Scene control functions
// function rotateScene(direction) {
//     const rotationSpeed = 0.5;
//     menuItems3D.forEach(item => {
//         const currentRotation = item.rotation.y;
//         item.rotation.y = direction === 'left' ? 
//             currentRotation + rotationSpeed : 
//             currentRotation - rotationSpeed;
//     });
    
//     showAIResponse("Let me show you more delicious options! 🔄");
// }

// function resetView() {
//     menuItems3D.forEach((item, index) => {
//         const angle = (index / menuItems3D.length) * Math.PI * 2;
//         const radius = 4;
//         item.position.x = Math.cos(angle) * radius;
//         item.position.z = Math.sin(angle) * radius;
//         item.rotation.set(0, 0, 0);
//     });
    
//     menuCamera.position.set(0, 3, 6);
//     showAIResponse("Perfect! Here's your full menu view. What catches your eye? 👀");
// }

// // Menu management
// function loadMenuItems() {
//     const menuGrid = document.getElementById('menu-grid');
//     menuGrid.innerHTML = '';

//     const itemsToShow = currentCategory === 'all' ? 
//         Object.values(menuData).flat() : 
//         menuData[currentCategory] || [];

//     itemsToShow.forEach(item => {
//         const itemCard = document.createElement('div');
//         itemCard.className = 'menu-item-card';
//         itemCard.innerHTML = `
//             <div class="menu-item-image">
//                 <span style="font-size: 4rem;">${item.emoji}</span>
//             </div>
//             <div class="menu-item-content">
//                 <h3 class="menu-item-name">${item.name}</h3>
//                 <p class="menu-item-description">${item.description}</p>
//                 <div class="menu-item-footer">
//                     <span class="menu-item-price">KSH ${item.price}</span>
//                     <button class="add-to-cart" onclick="addToCart(${item.id})">
//                         Add to Cart
//                     </button>
//                 </div>
//             </div>
//         `;
        
//         itemCard.addEventListener('click', () => highlightItem(item));
//         menuGrid.appendChild(itemCard);
//     });
// }

// function showCategory(category) {
//     currentCategory = category;
    
//     // Update active button
//     document.querySelectorAll('.category-btn').forEach(btn => {
//         btn.classList.remove('active');
//     });
//     event.target.classList.add('active');
    
//     // Reload menu items
//     loadMenuItems();
    
//     // AI response
//     const categoryMessages = {
//         all: "Here's our complete menu! What would you like to try? 🍽️",
//         appetizers: "Great choice! These appetizers will start your meal perfectly! 🥟",
//         mains: "Excellent! Our main courses are chef's specialties! 🍛",
//         drinks: "Perfect! Let me show you our beverage selection! 🍷",
//         desserts: "Sweet choice! Our desserts are the perfect ending! 🍰"
//     };
    
//     showAIResponse(categoryMessages[category] || "Let me show you these delicious options!");
// }

// // Cart management
// function addToCart(itemId) {
//     const allItems = Object.values(menuData).flat();
//     const item = allItems.find(i => i.id === itemId);
    
//     if (!item) return;

//     const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
//     if (existingItem) {
//         existingItem.quantity += 1;
//     } else {
//         cart.push({ ...item, quantity: 1 });
//     }
    
//     updateCartDisplay();
    
//     // AI responses
//     const responses = [
//         `Excellent choice! ${item.name} added to your order. 😊`,
//         `Great taste! ${item.name} is one of our favorites! ⭐`,
//         `Perfect! ${item.name} is now in your cart. Anything else? 🛒`,
//         `Wonderful selection! ${item.name} will be delicious! 🤤`
//     ];
    
//     const randomResponse = responses[Math.floor(Math.random() * responses.length)];
//     showAIResponse(randomResponse);
// }

// function removeFromCart(itemId) {
//     const itemIndex = cart.findIndex(item => item.id === itemId);
//     if (itemIndex > -1) {
//         const item = cart[itemIndex];
//         if (item.quantity > 1) {
//             item.quantity -= 1;
//         } else {
//             cart.splice(itemIndex, 1);
//         }
//         updateCartDisplay();
//         showAIResponse("No problem! I've updated your order. 👍");
//     }
// }

// function updateCartDisplay() {
//     const cartCount = document.getElementById('cart-count');
//     const cartItems = document.getElementById('cart-items');
//     const cartTotal = document.getElementById('cart-total');
    
//     // Update cart count
//     const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
//     cartCount.textContent = totalItems;
    
//     // Update cart items
//     cartItems.innerHTML = '';
    
//     if (cart.length === 0) {
//         cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
//     } else {
//         cart.forEach(item => {
//             const cartItem = document.createElement('div');
//             cartItem.className = 'cart-item';
//             cartItem.innerHTML = `
//                 <div class="cart-item-info">
//                     <div class="cart-item-name">${item.name}</div>
//                     <div class="cart-item-price">KSH ${item.price} x ${item.quantity}</div>
//                 </div>
//                 <div class="cart-item-controls">
//                     <button class="quantity-btn" onclick="removeFromCart(${item.id})">-</button>
//                     <span>${item.quantity}</span>
//                     <button class="quantity-btn" onclick="addToCart(${item.id})">+</button>
//                 </div>
//             `;
//             cartItems.appendChild(cartItem);
//         });
//     }
    
//     // Update total
//     const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     cartTotal.textContent = total;
// }

// function toggleCart() {
//     const cartSidebar = document.getElementById('cart-sidebar');
//     cartSidebar.classList.toggle('open');
// }

// function placeOrder() {
//     if (cart.length === 0) {
//         showAIResponse("Your cart is empty! Please add some delicious items first. 🛒");
//         return;
//     }

//     const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     const orderData = {
//         items: cart,
//         total: total,
//         tableNumber: document.getElementById('table-number').textContent,
//         timestamp: new Date().toISOString()
//     };

//     // Simulate order placement
//     console.log('Placing order:', orderData);
    
//     // Show confirmation
//     showOrderConfirmation(orderData);
    
//     // Clear cart
//     cart = [];
//     updateCartDisplay();
//     toggleCart();
// }

// function showOrderConfirmation(orderData) {
//     const modal = document.getElementById('order-modal');
//     const message = document.getElementById('order-confirmation-message');
    
//     const confirmationMessages = [
//         `Thank you! Your order of KSH ${orderData.total} is being prepared. 🍽️`,
//         `Wonderful! Your delicious meal will be ready in 15-20 minutes. ⏰`,
//         `Perfect! Your order is confirmed. Our chef is already working on it! 👨‍🍳`,
//         `Excellent choice! Your meal total is KSH ${orderData.total}. Preparing now! ✨`
//     ];
    
//     const randomMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
//     message.textContent = randomMessage;
    
//     modal.classList.add('show');
    
//     // Send to backend (simulated)
//     sendOrderToBackend(orderData);
// }

// function closeModal() {
//     const modal = document.getElementById('order-modal');
//     modal.classList.remove('show');
// }

// // AI response system
// function showAIResponse(message) {
//     const aiResponse = document.getElementById('ai-response');
//     const aiMessage = aiResponse.querySelector('p');
    
//     aiMessage.textContent = message;
    
//     // Add animation
//     aiResponse.style.transform = 'scale(1.02)';
//     setTimeout(() => {
//         aiResponse.style.transform = 'scale(1)';
//     }, 200);
// }

// function highlightItem(item) {
//     const responses = [
//         `${item.name} - ${item.description} for just KSH ${item.price}! 😋`,
//         `Great choice! ${item.name} is very popular with our guests! ⭐`,
//         `${item.name} sounds perfect! ${item.description} 🤤`,
//         `Excellent taste! ${item.name} is one of our chef's specialties! 👨‍🍳`
//     ];
    
//     const randomResponse = responses[Math.floor(Math.random() * responses.length)];
//     showAIResponse(randomResponse);
// }

// // Backend communication (simulated)
// async function sendOrderToBackend(orderData) {
//     try {
//         // Simulate API call
//         console.log('Sending order to backend:', orderData);
        
//         // In real app, this would be:
//         // const response = await fetch('/api/orders', {
//         //     method: 'POST',
//         //     headers: { 'Content-Type': 'application/json' },
//         //     body: JSON.stringify(orderData)
//         // });
        
//         // Simulate successful response
//         setTimeout(() => {
//             showAIResponse("Your order has been confirmed! Thank you for choosing ESSYTEL! 🎉");
//         }, 1000);
        
//     } catch (error) {
//         console.error('Error sending order:', error);
//         showAIResponse("Sorry, there was an issue with your order. Please try again. 😅");
//     }
// }

// // Initialize everything when page loads
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('ESSYTEL Order Page Loaded');
    
//     // Initialize 3D scene
//     setTimeout(initMenuScene, 100);
    
//     // Load menu items
//     loadMenuItems();
    
//     // Initialize cart display
//     updateCartDisplay();
    
//     // Welcome message
//     setTimeout(() => {
//         showAIResponse("Welcome! I'm here to help you order. Browse our 3D menu or use the categories below! 🍽️");
//     }, 1000);
    
//     // Set random table number
//     const tableNumber = Math.floor(Math.random() * 20) + 1;
//     document.getElementById('table-number').textContent = tableNumber;
// });

// // Make functions globally available
// window.showCategory = showCategory;
// window.addToCart = addToCart;
// window.removeFromCart = removeFromCart;
// window.toggleCart = toggleCart;
// window.placeOrder = placeOrder;
// window.closeModal = closeModal;
// window.rotateScene = rotateScene;
// window.resetView = resetView;