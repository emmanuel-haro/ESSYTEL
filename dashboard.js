
// ESSYTEL Hotel Dashboard JavaScript

let currentHotel = null;
let currentSection = 'orders';

// Initialize dashboard
function initDashboard() {
    // Check authentication
    const authData = localStorage.getItem('hotelAuth');
    if (!authData) {
        window.location.href = 'login.html';
        return;
    }
    
    currentHotel = JSON.parse(authData);
    
    // Update hotel name in header
    document.getElementById('hotel-name').textContent = currentHotel.hotelName;
    
    // Load initial data
    loadOrders();
    loadMenuItems();
    loadAnalytics();
    
    // Set up periodic updates
    setInterval(loadOrders, 30000); // Refresh orders every 30 seconds
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section and activate button
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    event.target.classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'orders':
            loadOrders();
            break;
        case 'menu':
            loadMenuItems();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Orders management
function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const totalOrdersEl = document.getElementById('total-orders');
    const pendingOrdersEl = document.getElementById('pending-orders');
    const dailyRevenueEl = document.getElementById('daily-revenue');
    
    // Get orders from localStorage (simulated backend)
    const allOrders = JSON.parse(localStorage.getItem('hotelOrders') || '[]');
    const hotelOrders = allOrders.filter(order => order.hotelId === currentHotel.id);
    
    // Add some demo orders if none exist
    if (hotelOrders.length === 0) {
        const demoOrders = generateDemoOrders();
        localStorage.setItem('hotelOrders', JSON.stringify([...allOrders, ...demoOrders]));
        loadOrders(); // Reload with demo data
        return;
    }
    
    // Calculate stats
    const today = new Date().toDateString();
    const todaysOrders = hotelOrders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    );
    const pendingOrders = hotelOrders.filter(order => order.status === 'pending');
    const dailyRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Update stats
    totalOrdersEl.textContent = hotelOrders.length;
    pendingOrdersEl.textContent = pendingOrders.length;
    dailyRevenueEl.textContent = dailyRevenue;
    
    // Display orders
    ordersList.innerHTML = '';
    
    if (hotelOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No orders yet. Orders will appear here when customers place them.</p>';
        return;
    }
    
    // Sort orders by timestamp (newest first)
    hotelOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    hotelOrders.slice(0, 10).forEach(order => { // Show only latest 10
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const itemsList = order.items.map(item => 
            `${item.name} x${item.quantity}`
        ).join(', ');
        
        const timeAgo = getTimeAgo(order.timestamp);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <div class="order-items">${itemsList}</div>
            <div class="order-details">
                <span>Table ${order.tableNumber} • ${timeAgo}</span>
                <span class="order-total">KSH ${order.total}</span>
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? 
                    `<button class="btn btn-small btn-primary" onclick="updateOrderStatus('${order.id}', 'completed')">Mark Complete</button>` :
                    `<span style="color: #28a745;">✓ Completed</span>`
                }
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

function generateDemoOrders() {
    const demoOrders = [
        {
            id: 'demo_1',
            hotelId: currentHotel.id,
            tableNumber: 5,
            items: [
                { name: 'Nyama Choma', quantity: 1, price: 800 },
                { name: 'Tusker Beer', quantity: 2, price: 200 }
            ],
            total: 1200,
            status: 'pending',
            timestamp: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutes ago
        },
        {
            id: 'demo_2',
            hotelId: currentHotel.id,
            tableNumber: 3,
            items: [
                { name: 'Fish & Chips', quantity: 1, price: 650 },
                { name: 'Fresh Juice', quantity: 1, price: 180 }
            ],
            total: 830,
            status: 'completed',
            timestamp: new Date(Date.now() - 45 * 60000).toISOString() // 45 minutes ago
        },
        {
            id: 'demo_3',
            hotelId: currentHotel.id,
            tableNumber: 8,
            items: [
                { name: 'Chicken Curry', quantity: 1, price: 700 },
                { name: 'Wine Glass', quantity: 1, price: 450 },
                { name: 'Chocolate Cake', quantity: 1, price: 300 }
            ],
            total: 1450,
            status: 'completed',
            timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString() // 2 hours ago
        }
    ];
    
    return demoOrders;
}

function updateOrderStatus(orderId, newStatus) {
    const allOrders = JSON.parse(localStorage.getItem('hotelOrders') || '[]');
    const orderIndex = allOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
        allOrders[orderIndex].status = newStatus;
        allOrders[orderIndex].completedAt = new Date().toISOString();
        localStorage.setItem('hotelOrders', JSON.stringify(allOrders));
        
        // Reload orders
        loadOrders();
        
        // Show success message
        showDashboardMessage(`Order #${orderId} marked as ${newStatus}!`, 'success');
    }
}

// Menu management
function loadMenuItems() {
    const menuGrid = document.getElementById('menu-items-grid');
    
    // Get hotel's menu items
    const hotelData = getHotelData();
    const menuItems = hotelData.menuItems || [];
    
    menuGrid.innerHTML = '';
    
    if (menuItems.length === 0) {
        menuGrid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px; grid-column: 1/-1;">No menu items yet. Add your first item to get started!</p>';
        return;
    }
    
    menuItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card-admin';
        itemCard.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">${item.emoji || '🍽️'}</div>
            <h4>${item.name}</h4>
            <p style="color: #666; margin: 10px 0;">${item.description}</p>
            <p><strong>KSH ${item.price}</strong></p>
            <p style="font-size: 0.9rem; color: #999;">Category: ${item.category}</p>
            <div class="item-actions">
                <button class="btn btn-small btn-outline" onclick="editMenuItem('${item.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteMenuItem('${item.id}')">Delete</button>
            </div>
        `;
        menuGrid.appendChild(itemCard);
    });
}

function showAddItemForm() {
    const form = document.getElementById('add-item-form');
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth' });
}

function hideAddItemForm() {
    const form = document.getElementById('add-item-form');
    form.classList.add('hidden');
    
    // Clear form
    form.querySelector('form').reset();
}

function addMenuItem(event) {
    event.preventDefault();
    
    const formData = {
        id: 'item_' + Date.now(),
        name: document.getElementById('item-name').value,
        price: parseInt(document.getElementById('item-price').value),
        description: document.getElementById('item-description').value,
        category: document.getElementById('item-category').value,
        image: document.getElementById('item-image').value,
        emoji: getCategoryEmoji(document.getElementById('item-category').value),
        available: true,
        createdAt: new Date().toISOString()
    };
    
    // Add to hotel's menu
    const hotelData = getHotelData();
    if (!hotelData.menuItems) {
        hotelData.menuItems = [];
    }
    hotelData.menuItems.push(formData);
    updateHotelData(hotelData);
    
    // Hide form and reload items
    hideAddItemForm();
    loadMenuItems();
    
    // Show success message
    showDashboardMessage(`Great! ${formData.name} is now live for customers. 🍽️`, 'success');
}

function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    const hotelData = getHotelData();
    hotelData.menuItems = hotelData.menuItems.filter(item => item.id !== itemId);
    updateHotelData(hotelData);
    
    loadMenuItems();
    showDashboardMessage('Menu item deleted successfully.', 'success');
}

function getCategoryEmoji(category) {
    const emojis = {
        appetizers: '🥟',
        mains: '🍛',
        drinks: '🍷',
        desserts: '🍰'
    };
    return emojis[category] || '🍽️';
}

// Analytics
function loadAnalytics() {
    const popularItemsEl = document.getElementById('popular-items');
    
    // Get orders and calculate popular items
    const allOrders = JSON.parse(localStorage.getItem('hotelOrders') || '[]');
    const hotelOrders = allOrders.filter(order => order.hotelId === currentHotel.id);
    
    // Count item frequencies
    const itemCounts = {};
    hotelOrders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    
    // Sort by popularity
    const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (sortedItems.length === 0) {
        popularItemsEl.innerHTML = '<p style="color: #666;">No order data yet. Popular items will appear here once customers start ordering.</p>';
        return;
    }
    
    popularItemsEl.innerHTML = '';
    sortedItems.forEach(([itemName, count], index) => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;';
        itemEl.innerHTML = `
            <span>${index + 1}. ${itemName}</span>
            <span style="font-weight: bold; color: #552834;">${count} orders</span>
        `;
        popularItemsEl.appendChild(itemEl);
    });
}

// Utility functions
function getHotelData() {
    const storedHotels = JSON.parse(localStorage.getItem('registeredHotels') || '[]');
    return storedHotels.find(hotel => hotel.id === currentHotel.id) || currentHotel;
}

function updateHotelData(hotelData) {
    const storedHotels = JSON.parse(localStorage.getItem('registeredHotels') || '[]');
    const hotelIndex = storedHotels.findIndex(hotel => hotel.id === currentHotel.id);
    
    if (hotelIndex > -1) {
        storedHotels[hotelIndex] = hotelData;
        localStorage.setItem('registeredHotels', JSON.stringify(storedHotels));
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}

function showDashboardMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.querySelector('.dashboard-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `dashboard-message ${type}`;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#552834'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // Animate in
    setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 4000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('hotelAuth');
        window.location.href = 'login.html';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('ESSYTEL Dashboard Loaded');
    initDashboard();
});

// Make functions globally available
window.showSection = showSection;
window.updateOrderStatus = updateOrderStatus;
window.showAddItemForm = showAddItemForm;
window.hideAddItemForm = hideAddItemForm;
window.addMenuItem = addMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.logout = logout;