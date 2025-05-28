
#!/usr/bin/env python3
"""
ESSYTEL Backend Server
Simple Flask server for hotel management and order processing with M-Pesa integration
"""

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid
import requests
import base64
from requests.auth import HTTPBasicAuth

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Data storage (in production, use a proper database)
DATA_DIR = "data"
HOTELS_FILE = os.path.join(DATA_DIR, "hotels.json")
ORDERS_FILE = os.path.join(DATA_DIR, "orders.json")
PAYMENTS_FILE = os.path.join(DATA_DIR, "payments.json")

# M-Pesa Configuration (you'll need to set these from your Daraja app)
MPESA_CONFIG = {
    'consumer_key': 'YOUR_CONSUMER_KEY_HERE',
    'consumer_secret': 'YOUR_CONSUMER_SECRET_HERE',
    'business_short_code': '174379',  # Test shortcode
    'passkey': 'YOUR_PASSKEY_HERE',
    'callback_url': 'https://your-domain.com/api/mpesa/callback',
    'base_url': 'https://sandbox.safaricom.co.ke'  # Use https://api.safaricom.co.ke for production
}

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(HOTELS_FILE):
        with open(HOTELS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(PAYMENTS_FILE):
        with open(PAYMENTS_FILE, 'w') as f:
            json.dump([], f)

init_data_files()

# Utility functions
def load_json_file(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_json_file(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def generate_polite_response(context="general"):
    """Generate polite AI responses based on context"""
    responses = {
        "order_received": [
            "Thank you for your order! Our chef is preparing your delicious meal. 🍽️",
            "Wonderful choice! Your order is being prepared with care. ⭐",
            "Excellent! We're working on your order right away. 👨‍🍳",
            "Perfect! Your meal will be ready shortly. Thank you for choosing us! 🌟"
        ],
        "payment_initiated": [
            "Please check your phone for the M-Pesa prompt to complete payment. 📱",
            "M-Pesa payment request sent! Please enter your PIN to confirm. 💳",
            "Almost done! Just confirm the payment on your phone. 😊",
            "Payment prompt sent to your phone. Thank you for choosing M-Pesa! 🙏"
        ],
        "payment_success": [
            "Payment successful! Your order is confirmed and being prepared. 🎉",
            "Thank you! Payment received. Your delicious meal is on the way! ✨",
            "Perfect! Payment confirmed. Our chef is already working on your order! 👨‍🍳",
            "Excellent! Payment complete. Your meal will be ready shortly! 🍽️"
        ],
        "payment_failed": [
            "Payment was not completed. Please try again or contact us for assistance. 😔",
            "Oops! Payment didn't go through. Would you like to try again? 🔄",
            "Payment unsuccessful. Please check your M-Pesa balance and try again. 💔",
            "Payment failed. Our team is here to help if you need assistance! 🤝"
        ]
    }
    
    import random
    return random.choice(responses.get(context, responses["order_received"]))

# M-Pesa helper functions
def get_mpesa_access_token():
    """Get access token from Safaricom API"""
    try:
        url = f"{MPESA_CONFIG['base_url']}/oauth/v1/generate?grant_type=client_credentials"
        
        response = requests.get(
            url,
            auth=HTTPBasicAuth(MPESA_CONFIG['consumer_key'], MPESA_CONFIG['consumer_secret'])
        )
        
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f"Failed to get access token: {response.text}")
            return None
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

def generate_mpesa_password():
    """Generate M-Pesa password"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_string = f"{MPESA_CONFIG['business_short_code']}{MPESA_CONFIG['passkey']}{timestamp}"
    password = base64.b64encode(password_string.encode()).decode('utf-8')
    return password, timestamp

# API Routes

@app.route('/')
def home():
    return render_template_string("""
    <h1>ESSYTEL Backend Server with M-Pesa Integration</h1>
    <p>Server is running successfully! 🚀</p>
    <p>Available endpoints:</p>
    <ul>
        <li>POST /api/register - Register new hotel</li>
        <li>POST /api/login - Hotel login</li>
        <li>GET /api/menu/<hotel_id> - Get hotel menu</li>
        <li>POST /api/menu - Add menu item</li>
        <li>POST /api/orders - Place new order</li>
        <li>GET /api/orders/<hotel_id> - Get hotel orders</li>
        <li>PUT /api/orders/<order_id> - Update order status</li>
        <li>POST /api/mpesa/payment - Initiate M-Pesa payment</li>
        <li>POST /api/mpesa/callback - M-Pesa callback handler</li>
        <li>GET /api/payments/<order_id> - Get payment status</li>
    </ul>
    """)

# ... keep existing code (register, login, menu, orders endpoints)

@app.route('/api/register', methods=['POST'])
def register_hotel():
    """Register a new hotel"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['hotelName', 'email', 'phone', 'location', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing {field}'}), 400
        
        # Load existing hotels
        hotels = load_json_file(HOTELS_FILE)
        
        # Check if hotel already exists
        existing_hotel = next((h for h in hotels if h['email'] == data['email'] or h['phone'] == data['phone']), None)
        if existing_hotel:
            return jsonify({'success': False, 'message': 'Hotel with this email or phone already exists'}), 409
        
        # Create new hotel
        new_hotel = {
            'id': str(uuid.uuid4()),
            'hotelName': data['hotelName'],
            'email': data['email'],
            'phone': data['phone'],
            'location': data['location'],
            'password': data['password'],  # In production, hash this!
            'createdAt': datetime.now().isoformat(),
            'menuItems': [],
            'isActive': True
        }
        
        # Add to hotels list
        hotels.append(new_hotel)
        save_json_file(HOTELS_FILE, hotels)
        
        return jsonify({
            'success': True,
            'message': 'Hotel registered successfully!',
            'hotel_id': new_hotel['id']
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login_hotel():
    """Authenticate hotel login"""
    try:
        data = request.get_json()
        email_or_phone = data.get('email')
        password = data.get('password')
        
        if not email_or_phone or not password:
            return jsonify({'success': False, 'message': 'Email/phone and password required'}), 400
        
        # Load hotels
        hotels = load_json_file(HOTELS_FILE)
        
        # Find hotel
        hotel = next((h for h in hotels if (h['email'] == email_or_phone or h['phone'] == email_or_phone) and h['password'] == password), None)
        
        if not hotel:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Return hotel data (excluding password)
        hotel_data = {k: v for k, v in hotel.items() if k != 'password'}
        hotel_data['loginTime'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'message': f'Welcome back, {hotel["hotelName"]}!',
            'data': hotel_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def place_order():
    """Place a new order"""
    try:
        data = request.get_json()
        
        # Create order
        order = {
            'id': str(uuid.uuid4()),
            'hotel_id': data.get('hotel_id', 'default'),
            'table_number': data.get('table_number', 1),
            'items': data['items'],
            'total': float(data['total']),
            'status': 'pending_payment',
            'payment_status': 'pending',
            'timestamp': datetime.now().isoformat(),
            'customer_notes': data.get('notes', ''),
            'customer_phone': data.get('phone', '')
        }
        
        # Load and save orders
        orders = load_json_file(ORDERS_FILE)
        orders.append(order)
        save_json_file(ORDERS_FILE, orders)
        
        return jsonify({
            'success': True,
            'message': generate_polite_response("order_received"),
            'order_id': order['id'],
            'estimated_time': '15-20 minutes'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# M-Pesa Payment Endpoints
@app.route('/api/mpesa/payment', methods=['POST'])
def initiate_mpesa_payment():
    """Initiate M-Pesa STK Push payment"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        phone_number = data.get('phone_number')
        amount = int(float(data.get('amount', 0)))
        
        if not all([order_id, phone_number, amount]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Format phone number (remove leading 0 and add 254)
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        # Get access token
        access_token = get_mpesa_access_token()
        if not access_token:
            return jsonify({'success': False, 'message': 'Failed to authenticate with M-Pesa'}), 500
        
        # Generate password and timestamp
        password, timestamp = generate_mpesa_password()
        
        # STK Push request
        url = f"{MPESA_CONFIG['base_url']}/mpesa/stkpush/v1/processrequest"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': MPESA_CONFIG['business_short_code'],
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': amount,
            'PartyA': phone_number,
            'PartyB': MPESA_CONFIG['business_short_code'],
            'PhoneNumber': phone_number,
            'CallBackURL': MPESA_CONFIG['callback_url'],
            'AccountReference': f'ESSYTEL-{order_id}',
            'TransactionDesc': f'Payment for ESSYTEL Order {order_id}'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            mpesa_response = response.json()
            
            if mpesa_response.get('ResponseCode') == '0':
                # Save payment record
                payment = {
                    'id': str(uuid.uuid4()),
                    'order_id': order_id,
                    'checkout_request_id': mpesa_response.get('CheckoutRequestID'),
                    'merchant_request_id': mpesa_response.get('MerchantRequestID'),
                    'phone_number': phone_number,
                    'amount': amount,
                    'status': 'pending',
                    'timestamp': datetime.now().isoformat()
                }
                
                payments = load_json_file(PAYMENTS_FILE)
                payments.append(payment)
                save_json_file(PAYMENTS_FILE, payments)
                
                return jsonify({
                    'success': True,
                    'message': generate_polite_response("payment_initiated"),
                    'checkout_request_id': mpesa_response.get('CheckoutRequestID'),
                    'merchant_request_id': mpesa_response.get('MerchantRequestID')
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': mpesa_response.get('errorMessage', 'Payment initiation failed')
                }), 400
        else:
            return jsonify({'success': False, 'message': 'M-Pesa service unavailable'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa payment callback"""
    try:
        data = request.get_json()
        
        # Extract callback data
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        # Find payment record
        payments = load_json_file(PAYMENTS_FILE)
        payment_index = next((i for i, p in enumerate(payments) if p['checkout_request_id'] == checkout_request_id), None)
        
        if payment_index is not None:
            payment = payments[payment_index]
            
            if result_code == 0:  # Success
                # Extract transaction details
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])
                
                transaction_id = None
                for item in items:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        transaction_id = item.get('Value')
                        break
                
                # Update payment status
                payments[payment_index]['status'] = 'completed'
                payments[payment_index]['transaction_id'] = transaction_id
                payments[payment_index]['completed_at'] = datetime.now().isoformat()
                
                # Update order status
                orders = load_json_file(ORDERS_FILE)
                order_index = next((i for i, o in enumerate(orders) if o['id'] == payment['order_id']), None)
                
                if order_index is not None:
                    orders[order_index]['payment_status'] = 'completed'
                    orders[order_index]['status'] = 'confirmed'
                    orders[order_index]['transaction_id'] = transaction_id
                    save_json_file(ORDERS_FILE, orders)
                
            else:  # Failed
                payments[payment_index]['status'] = 'failed'
                payments[payment_index]['failure_reason'] = result_desc
                
                # Update order status
                orders = load_json_file(ORDERS_FILE)
                order_index = next((i for i, o in enumerate(orders) if o['id'] == payment['order_id']), None)
                
                if order_index is not None:
                    orders[order_index]['payment_status'] = 'failed'
                    save_json_file(ORDERS_FILE, orders)
            
            save_json_file(PAYMENTS_FILE, payments)
        
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
        
    except Exception as e:
        print(f"Callback error: {e}")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Failed'}), 500

@app.route('/api/payments/<order_id>', methods=['GET'])
def get_payment_status(order_id):
    """Get payment status for an order"""
    try:
        payments = load_json_file(PAYMENTS_FILE)
        payment = next((p for p in payments if p['order_id'] == order_id), None)
        
        if not payment:
            return jsonify({'success': False, 'message': 'Payment not found'}), 404
        
        return jsonify({
            'success': True,
            'payment': payment
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ... keep existing code (other endpoints)

if __name__ == '__main__':
    print("🚀 ESSYTEL Backend Server with M-Pesa Starting...")
    print("📊 Server will run on http://localhost:5000")
    print("💳 M-Pesa integration enabled!")
    print("🍽️ Ready to serve delicious orders!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)





















 #!/usr/bin/env python3
# """
# ESSYTEL Backend Server
# Simple Flask server for hotel management and order processing
# """

# from flask import Flask, request, jsonify, render_template_string
# from flask_cors import CORS
# import json
# import os
# from datetime import datetime
# import uuid

# app = Flask(__name__)
# CORS(app)  # Enable CORS for frontend

# # Data storage (in production, use a proper database)
# DATA_DIR = "data"
# HOTELS_FILE = os.path.join(DATA_DIR, "hotels.json")
# ORDERS_FILE = os.path.join(DATA_DIR, "orders.json")

# # Ensure data directory exists
# os.makedirs(DATA_DIR, exist_ok=True)

# # Initialize data files if they don't exist
# def init_data_files():
#     if not os.path.exists(HOTELS_FILE):
#         with open(HOTELS_FILE, 'w') as f:
#             json.dump([], f)
    
#     if not os.path.exists(ORDERS_FILE):
#         with open(ORDERS_FILE, 'w') as f:
#             json.dump([], f)

# init_data_files()

# # Utility functions
# def load_json_file(filename):
#     try:
#         with open(filename, 'r') as f:
#             return json.load(f)
#     except (FileNotFoundError, json.JSONDecodeError):
#         return []

# def save_json_file(filename, data):
#     with open(filename, 'w') as f:
#         json.dump(data, f, indent=2)

# def generate_polite_response(context="general"):
#     """Generate polite AI responses based on context"""
#     responses = {
#         "order_received": [
#             "Thank you for your order! Our chef is preparing your delicious meal. 🍽️",
#             "Wonderful choice! Your order is being prepared with care. ⭐",
#             "Excellent! We're working on your order right away. 👨‍🍳",
#             "Perfect! Your meal will be ready shortly. Thank you for choosing us! 🌟"
#         ],
#         "order_complete": [
#             "Your order is ready! Enjoy your delicious meal! 😊",
#             "Bon appétit! Your food is served with love. 🍽️",
#             "Everything looks perfect! Please enjoy your meal. ✨",
#             "Your order is complete. We hope you love every bite! 💖"
#         ],
#         "welcome": [
#             "Welcome to ESSYTEL! How may I assist you today? 🤖",
#             "Good day! I'm here to help with your dining experience. 😊",
#             "Hello! Ready to explore our delicious menu? 🍽️",
#             "Welcome! Let me help you find something amazing to eat. ⭐"
#         ]
#     }
    
#     import random
#     return random.choice(responses.get(context, responses["welcome"]))

# # API Routes

# @app.route('/')
# def home():
#     return render_template_string("""
#     <h1>ESSYTEL Backend Server</h1>
#     <p>Server is running successfully! 🚀</p>
#     <p>Available endpoints:</p>
#     <ul>
#         <li>POST /api/register - Register new hotel</li>
#         <li>POST /api/login - Hotel login</li>
#         <li>GET /api/menu/<hotel_id> - Get hotel menu</li>
#         <li>POST /api/menu - Add menu item</li>
#         <li>POST /api/orders - Place new order</li>
#         <li>GET /api/orders/<hotel_id> - Get hotel orders</li>
#         <li>PUT /api/orders/<order_id> - Update order status</li>
#     </ul>
#     """)

# @app.route('/api/register', methods=['POST'])
# def register_hotel():
#     """Register a new hotel"""
#     try:
#         data = request.get_json()
        
#         # Validate required fields
#         required_fields = ['hotelName', 'email', 'phone', 'location', 'password']
#         for field in required_fields:
#             if field not in data:
#                 return jsonify({'success': False, 'message': f'Missing {field}'}), 400
        
#         # Load existing hotels
#         hotels = load_json_file(HOTELS_FILE)
        
#         # Check if hotel already exists
#         existing_hotel = next((h for h in hotels if h['email'] == data['email'] or h['phone'] == data['phone']), None)
#         if existing_hotel:
#             return jsonify({'success': False, 'message': 'Hotel with this email or phone already exists'}), 409
        
#         # Create new hotel
#         new_hotel = {
#             'id': str(uuid.uuid4()),
#             'hotelName': data['hotelName'],
#             'email': data['email'],
#             'phone': data['phone'],
#             'location': data['location'],
#             'password': data['password'],  # In production, hash this!
#             'createdAt': datetime.now().isoformat(),
#             'menuItems': [],
#             'isActive': True
#         }
        
#         # Add to hotels list
#         hotels.append(new_hotel)
#         save_json_file(HOTELS_FILE, hotels)
        
#         return jsonify({
#             'success': True,
#             'message': 'Hotel registered successfully!',
#             'hotel_id': new_hotel['id']
#         }), 201
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/login', methods=['POST'])
# def login_hotel():
#     """Authenticate hotel login"""
#     try:
#         data = request.get_json()
#         email_or_phone = data.get('email')
#         password = data.get('password')
        
#         if not email_or_phone or not password:
#             return jsonify({'success': False, 'message': 'Email/phone and password required'}), 400
        
#         # Load hotels
#         hotels = load_json_file(HOTELS_FILE)
        
#         # Find hotel
#         hotel = next((h for h in hotels if (h['email'] == email_or_phone or h['phone'] == email_or_phone) and h['password'] == password), None)
        
#         if not hotel:
#             return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
#         # Return hotel data (excluding password)
#         hotel_data = {k: v for k, v in hotel.items() if k != 'password'}
#         hotel_data['loginTime'] = datetime.now().isoformat()
        
#         return jsonify({
#             'success': True,
#             'message': f'Welcome back, {hotel["hotelName"]}!',
#             'data': hotel_data
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/menu/<hotel_id>', methods=['GET'])
# def get_menu(hotel_id):
#     """Get hotel's menu items"""
#     try:
#         hotels = load_json_file(HOTELS_FILE)
#         hotel = next((h for h in hotels if h['id'] == hotel_id), None)
        
#         if not hotel:
#             return jsonify({'success': False, 'message': 'Hotel not found'}), 404
        
#         return jsonify({
#             'success': True,
#             'menuItems': hotel.get('menuItems', [])
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/menu', methods=['POST'])
# def add_menu_item():
#     """Add new menu item to hotel"""
#     try:
#         data = request.get_json()
#         hotel_id = data.get('hotel_id')
        
#         if not hotel_id:
#             return jsonify({'success': False, 'message': 'Hotel ID required'}), 400
        
#         # Load hotels
#         hotels = load_json_file(HOTELS_FILE)
#         hotel_index = next((i for i, h in enumerate(hotels) if h['id'] == hotel_id), None)
        
#         if hotel_index is None:
#             return jsonify({'success': False, 'message': 'Hotel not found'}), 404
        
#         # Create menu item
#         menu_item = {
#             'id': str(uuid.uuid4()),
#             'name': data['name'],
#             'description': data['description'],
#             'price': float(data['price']),
#             'category': data['category'],
#             'image': data.get('image', ''),
#             'available': True,
#             'createdAt': datetime.now().isoformat()
#         }
        
#         # Add to hotel's menu
#         if 'menuItems' not in hotels[hotel_index]:
#             hotels[hotel_index]['menuItems'] = []
        
#         hotels[hotel_index]['menuItems'].append(menu_item)
#         save_json_file(HOTELS_FILE, hotels)
        
#         return jsonify({
#             'success': True,
#             'message': generate_polite_response("order_complete"),
#             'item': menu_item
#         }), 201
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/orders', methods=['POST'])
# def place_order():
#     """Place a new order"""
#     try:
#         data = request.get_json()
        
#         # Create order
#         order = {
#             'id': str(uuid.uuid4()),
#             'hotel_id': data.get('hotel_id', 'default'),
#             'table_number': data.get('table_number', 1),
#             'items': data['items'],
#             'total': float(data['total']),
#             'status': 'pending',
#             'timestamp': datetime.now().isoformat(),
#             'customer_notes': data.get('notes', '')
#         }
        
#         # Load and save orders
#         orders = load_json_file(ORDERS_FILE)
#         orders.append(order)
#         save_json_file(ORDERS_FILE, orders)
        
#         return jsonify({
#             'success': True,
#             'message': generate_polite_response("order_received"),
#             'order_id': order['id'],
#             'estimated_time': '15-20 minutes'
#         }), 201
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/orders/<hotel_id>', methods=['GET'])
# def get_hotel_orders(hotel_id):
#     """Get orders for specific hotel"""
#     try:
#         orders = load_json_file(ORDERS_FILE)
#         hotel_orders = [order for order in orders if order.get('hotel_id') == hotel_id]
        
#         # Sort by timestamp (newest first)
#         hotel_orders.sort(key=lambda x: x['timestamp'], reverse=True)
        
#         return jsonify({
#             'success': True,
#             'orders': hotel_orders
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/orders/<order_id>', methods=['PUT'])
# def update_order_status(order_id):
#     """Update order status"""
#     try:
#         data = request.get_json()
#         new_status = data.get('status')
        
#         if not new_status:
#             return jsonify({'success': False, 'message': 'Status required'}), 400
        
#         # Load orders
#         orders = load_json_file(ORDERS_FILE)
#         order_index = next((i for i, order in enumerate(orders) if order['id'] == order_id), None)
        
#         if order_index is None:
#             return jsonify({'success': False, 'message': 'Order not found'}), 404
        
#         # Update status
#         orders[order_index]['status'] = new_status
#         orders[order_index]['updated_at'] = datetime.now().isoformat()
        
#         if new_status == 'completed':
#             orders[order_index]['completed_at'] = datetime.now().isoformat()
        
#         save_json_file(ORDERS_FILE, orders)
        
#         context = "order_complete" if new_status == "completed" else "general"
        
#         return jsonify({
#             'success': True,
#             'message': generate_polite_response(context),
#             'order': orders[order_index]
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# @app.route('/api/ai-response', methods=['POST'])
# def get_ai_response():
#     """Get polite AI response"""
#     try:
#         data = request.get_json()
#         context = data.get('context', 'general')
        
#         response = generate_polite_response(context)
        
#         return jsonify({
#             'success': True,
#             'response': response
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# # Analytics endpoint
# @app.route('/api/analytics/<hotel_id>', methods=['GET'])
# def get_analytics(hotel_id):
#     """Get analytics data for hotel"""
#     try:
#         orders = load_json_file(ORDERS_FILE)
#         hotel_orders = [order for order in orders if order.get('hotel_id') == hotel_id]
        
#         # Calculate analytics
#         total_orders = len(hotel_orders)
#         total_revenue = sum(order['total'] for order in hotel_orders)
        
#         # Popular items
#         item_counts = {}
#         for order in hotel_orders:
#             for item in order['items']:
#                 item_name = item['name']
#                 item_counts[item_name] = item_counts.get(item_name, 0) + item['quantity']
        
#         popular_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
#         return jsonify({
#             'success': True,
#             'analytics': {
#                 'total_orders': total_orders,
#                 'total_revenue': total_revenue,
#                 'popular_items': popular_items
#             }
#         }), 200
        
#     except Exception as e:
#         return jsonify({'success': False, 'message': str(e)}), 500

# if __name__ == '__main__':
#     print("🚀 ESSYTEL Backend Server Starting...")
#     print("📊 Server will run on http://localhost:5000")
#     print("🍽️ Ready to serve delicious orders!")
    
#     app.run(debug=True, host='0.0.0.0', port=5000)