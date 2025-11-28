# ShopMaterial - Online Shopping Web Application

A fully functional, responsive Online Shopping Web Application built with HTML5, CSS3 (Bootstrap 5 + Custom Material Design), and Vanilla JavaScript. This application uses `localStorage` for data persistence.

## Features

- **Authentication**: User Registration and Login.
- **Admin Dashboard**: Special access for Admin to Add, Edit, and Delete products.
- **Product Catalog**: View products in a responsive grid layout.
- **Shopping Cart**: Add items, adjust quantities, and view total price.
- **Material Design**: Custom styled Bootstrap components for a modern look.
- **Persistence**: All data (Users, Products, Cart) is saved in the browser's LocalStorage.

## File Structure

- `index.html`: Entry point. Handles User Login and Registration.
- `home.html`: Main landing page with Hero section and navigation.
- `shop.html`: Product listing page.
- `add-product.html`: Admin-only page for creating and updating products.
- `cart.html`: Shopping cart page.
- `style.css`: Custom CSS for Material Design aesthetics.
- `script.js`: Core logic for Authentication, CRUD operations, and DOM manipulation.

## Getting Started

1. **Clone/Download** the repository.
2. Open `index.html` in your browser.
3. **Register** a new user account to shop.
4. **Login as Admin** to manage products.

## Admin Access

To access Admin features (Add/Edit/Delete Products), login with the following credentials:

- **Email**: `admin@gmail.com`
- **Password**: `admin123`

## Implementation Details

### CRUD Operations
- **Create**: Admin can add new products via `add-product.html`. Data is pushed to the `products` array in `localStorage`.
- **Read**: Products are fetched from `localStorage` and rendered on `shop.html`.
- **Update**: Admin can edit existing products. The app uses a query parameter/localStorage flag to pass the product ID to the edit form.
- **Delete**: Admin can remove products. This also removes the item from any active carts.

### Technologies Used
- **HTML5**: Semantic structure.
- **CSS3**: Custom styling and animations.
- **Bootstrap 5**: Responsive grid and components.
- **JavaScript (ES6+)**: Logic and state management.
- **LocalStorage**: Client-side database.

## License
MIT
