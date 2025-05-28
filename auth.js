
// ESSYTEL Authentication JavaScript

// Tab switching
function showTab(tabName) {
    // Hide all forms
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected form and activate tab
    document.getElementById(`${tabName}-form`).classList.remove('hidden');
    event.target.classList.add('active');
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('Login attempt:', { email });
    
    try {
        // Simulate API call
        const response = await simulateLogin({ email, password });
        
        if (response.success) {
            // Store user data
            localStorage.setItem('hotelAuth', JSON.stringify(response.data));
            
            // Show success message
            showMessage('Welcome back! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage(response.message || 'Invalid credentials', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = {
        hotelName: document.getElementById('hotel-name').value,
        email: document.getElementById('hotel-email').value,
        phone: document.getElementById('hotel-phone').value,
        location: document.getElementById('hotel-location').value,
        password: document.getElementById('hotel-password').value,
        confirmPassword: document.getElementById('confirm-password').value
    };
    
    // Validate form
    if (!validateRegistration(formData)) {
        return;
    }
    
    console.log('Registration attempt:', { ...formData, password: '***' });
    
    try {
        // Simulate API call
        const response = await simulateRegistration(formData);
        
        if (response.success) {
            showMessage('Registration successful! Please sign in to continue.', 'success');
            
            // Switch to login tab
            setTimeout(() => {
                document.querySelector('.tab-btn').click();
                // Pre-fill email
                document.getElementById('login-email').value = formData.email;
            }, 1500);
        } else {
            showMessage(response.message || 'Registration failed', 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Validate registration data
function validateRegistration(data) {
    if (data.password !== data.confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return false;
    }
    
    if (data.password.length < 6) {
        showMessage('Password must be at least 6 characters long!', 'error');
        return false;
    }
    
    if (!data.email.includes('@')) {
        showMessage('Please enter a valid email address!', 'error');
        return false;
    }
    
    if (!data.phone.startsWith('+254')) {
        showMessage('Please enter a valid Kenyan phone number (+254...)!', 'error');
        return false;
    }
    
    return true;
}

// Simulate login API call
async function simulateLogin(credentials) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Check stored hotels (in real app, this would be server-side)
            const storedHotels = JSON.parse(localStorage.getItem('registeredHotels') || '[]');
            const hotel = storedHotels.find(h => 
                (h.email === credentials.email || h.phone === credentials.email) && 
                h.password === credentials.password
            );
            
            if (hotel) {
                resolve({
                    success: true,
                    data: {
                        id: hotel.id,
                        hotelName: hotel.hotelName,
                        email: hotel.email,
                        phone: hotel.phone,
                        location: hotel.location,
                        loginTime: new Date().toISOString()
                    }
                });
            } else {
                // Default demo account
                if (credentials.email === 'demo@hotel.com' && credentials.password === 'demo123') {
                    resolve({
                        success: true,
                        data: {
                            id: 'demo',
                            hotelName: 'Demo Hotel',
                            email: 'demo@hotel.com',
                            phone: '+254700000000',
                            location: 'Nairobi, Kenya',
                            loginTime: new Date().toISOString()
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Invalid email/phone or password'
                    });
                }
            }
        }, 1000); // Simulate network delay
    });
}

// Simulate registration API call
async function simulateRegistration(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Check if hotel already exists
            const storedHotels = JSON.parse(localStorage.getItem('registeredHotels') || '[]');
            const existingHotel = storedHotels.find(h => 
                h.email === data.email || h.phone === data.phone
            );
            
            if (existingHotel) {
                resolve({
                    success: false,
                    message: 'Hotel with this email or phone number already exists'
                });
            } else {
                // Add new hotel
                const newHotel = {
                    id: 'hotel_' + Date.now(),
                    hotelName: data.hotelName,
                    email: data.email,
                    phone: data.phone,
                    location: data.location,
                    password: data.password, // In real app, this would be hashed
                    createdAt: new Date().toISOString(),
                    menuItems: [], // Initialize empty menu
                    orders: [] // Initialize empty orders
                };
                
                storedHotels.push(newHotel);
                localStorage.setItem('registeredHotels', JSON.stringify(storedHotels));
                
                resolve({
                    success: true,
                    message: 'Hotel registered successfully!'
                });
            }
        }, 1200); // Simulate network delay
    });
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `auth-message ${type}`;
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

// Check if user is already logged in
function checkAuthStatus() {
    const authData = localStorage.getItem('hotelAuth');
    if (authData) {
        const userData = JSON.parse(authData);
        showMessage(`Welcome back, ${userData.hotelName}! Redirecting...`, 'info');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('ESSYTEL Auth Page Loaded');
    
    // Check if already logged in
    checkAuthStatus();
    
    // Add form validation on input
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '';
            }
        });
        
        input.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('hotel-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('254')) {
                value = '+' + value;
            } else if (value.startsWith('0')) {
                value = '+254' + value.substring(1);
            } else if (!value.startsWith('+254')) {
                value = '+254' + value;
            }
            this.value = value;
        });
    }
    
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.style.borderColor = '#dc3545';
                showMessage('Please enter a valid email address', 'error');
            }
        });
    });
});

// Make functions globally available
window.showTab = showTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;