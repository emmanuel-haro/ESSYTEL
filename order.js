
// ESSYTEL Order Page JavaScript - 3D Menu and Cart System

let menuScene, menuCamera, menuRenderer;
let menuItems3D = [];
let cart = [];
let currentCategory = 'all';

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

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        items: cart,
        total: total,
        tableNumber: document.getElementById('table-number').textContent,
        timestamp: new Date().toISOString()
    };

    // Simulate order placement
    console.log('Placing order:', orderData);
    
    // Show confirmation
    showOrderConfirmation(orderData);
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    toggleCart();
}

function showOrderConfirmation(orderData) {
    const modal = document.getElementById('order-modal');
    const message = document.getElementById('order-confirmation-message');
    
    const confirmationMessages = [
        `Thank you! Your order of KSH ${orderData.total} is being prepared. 🍽️`,
        `Wonderful! Your delicious meal will be ready in 15-20 minutes. ⏰`,
        `Perfect! Your order is confirmed. Our chef is already working on it! 👨‍🍳`,
        `Excellent choice! Your meal total is KSH ${orderData.total}. Preparing now! ✨`
    ];
    
    const randomMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
    message.textContent = randomMessage;
    
    modal.classList.add('show');
    
    // Send to backend (simulated)
    sendOrderToBackend(orderData);
}

function closeModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.remove('show');
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
    console.log('ESSYTEL Order Page Loaded');
    
    // Initialize 3D scene
    setTimeout(initMenuScene, 100);
    
    // Load menu items
    loadMenuItems();
    
    // Initialize cart display
    updateCartDisplay();
    
    // Welcome message
    setTimeout(() => {
        showAIResponse("Welcome! I'm here to help you order. Browse our 3D menu or use the categories below! 🍽️");
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