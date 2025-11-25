# MERN E-commerce Application

A full-featured MERN stack e-commerce application with modern UI and comprehensive admin panel.

## Features

### Frontend
- **Responsive Design**: Bootstrap 5 based responsive UI
- **Product Management**: Product listing, search, filtering, and details
- **Shopping Cart**: Add to cart, update quantities, persistent cart
- **User Authentication**: Login, registration, profile management
- **Admin Panel**: Complete admin dashboard for managing the store
- **Search Functionality**: Collapsible search bar with results page
- **Social Media Integration**: Configurable social media links in footer
- **Facebook Pixel**: Optional Facebook Pixel integration for tracking

### Backend
- **RESTful API**: Express.js based API with JWT authentication
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer for image uploads
- **Payment Integration**: Support for multiple payment gateways (Bkash, Nagad, SSL Commerz, Stripe, PayPal)
- **Courier Services**: Integration with Pathao and Steadfast
- **Order Management**: Complete order lifecycle management
- **Settings Management**: Configurable store settings

### Admin Features
- **Dashboard**: Overview of orders, products, and revenue
- **Product Management**: CRUD operations for products and variations
- **Category Management**: Organize products with categories
- **Order Management**: View and update order status
- **User Management**: Manage customers and admins
- **Settings**: Configure store settings, social media, Facebook Pixel
- **Content Management**: Manage pages and sliders

## Tech Stack

- **Frontend**: React 18, Bootstrap 5, Parcel
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT
- **File Storage**: Local storage (configurable for cloud)
- **State Management**: React Context

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Nur-Alam39/mern-e-comerce.git
cd mern-ecommerce
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env to configure MONGO_URI, JWT_SECRET, and other settings
npm install
npm run dev
```

3. **Seed Database** (Optional)
```bash
npm run seed
```

4. **Frontend Setup** (in another terminal)
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Configuration

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and configure:

```env
MONGO_URI=mongodb://localhost:27017/mern-ecommerce
JWT_SECRET=your-secret-key
PORT=5000
```

### Admin Access
Create an admin user by setting `isAdmin: true` in the database or through registration with admin privileges.

## Project Structure

```
mern-ecommerce/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── admin/
│   │   ├── context/
│   │   └── hooks/
│   └── public/
└── README.md
```

## API Documentation

### Main Endpoints
- `GET /api/products` - Get products with filtering
- `POST /api/auth/login` - User login
- `POST /api/orders` - Create order
- `GET /api/settings` - Get store settings

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/products` - Create product
- `PUT /api/admin/settings` - Update settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
