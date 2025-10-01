# Testing Guide - Judicature Platform

## 🧪 **Test Coverage Overview**

This guide covers testing strategies for the complete Judicature platform, including the Stripe Connect escrow system.

---

## 🔧 **Backend Testing**

### **Unit Tests (Jest)**

#### **1. Authentication Tests**
```javascript
// backend/tests/auth.test.js
describe('Authentication', () => {
  test('should register new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com', 
      password: 'password123',
      role: 'client'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.token).toBeDefined();
  });
  
  test('should login existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
      
    expect(response.body.token).toBeDefined();
  });
});
```

#### **2. Stripe Connect Tests**
```javascript
// backend/tests/stripe.test.js  
describe('Stripe Connect', () => {
  test('should create lawyer stripe account', async () => {
    const response = await request(app)
      .post('/api/stripe-connect/create-account')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .send({
        email: 'lawyer@example.com',
        country: 'IN',
        businessType: 'individual'
      })
      .expect(201);
      
    expect(response.body.accountId).toBeDefined();
  });
  
  test('should create payment order', async () => {
    const orderData = {
      lawyerId: 'lawyer_id_here',
      serviceType: 'consultation',
      amount: 5000,
      currency: 'inr',
      description: 'Legal consultation'
    };
    
    const response = await request(app)
      .post('/api/orders/create')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(orderData)
      .expect(201);
      
    expect(response.body.orderId).toBeDefined();
    expect(response.body.paymentIntentId).toBeDefined();
  });
});
```

#### **3. Order Management Tests**
```javascript
// backend/tests/orders.test.js
describe('Order Management', () => {
  test('should process payment successfully', async () => {
    const response = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ paymentMethodId: 'pm_card_visa' })
      .expect(200);
      
    expect(response.body.status).toBe('succeeded');
  });
  
  test('should release funds after deliverable acceptance', async () => {
    // First accept deliverable
    await request(app)
      .post(`/api/deliverables/${deliverableId}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
      
    // Then release funds
    const response = await request(app)
      .post(`/api/orders/${orderId}/release-funds`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
      
    expect(response.body.message).toContain('released');
  });
});
```

### **Integration Tests**

#### **Complete Payment Flow Test**
```javascript
// backend/tests/integration/payment-flow.test.js
describe('Complete Payment Flow', () => {
  test('end-to-end escrow payment process', async () => {
    // 1. Create lawyer account
    const accountResponse = await createStripeAccount(lawyerToken);
    expect(accountResponse.status).toBe(201);
    
    // 2. Create order
    const orderResponse = await createOrder(clientToken, {
      lawyerId: lawyerId,
      serviceType: 'consultation',
      amount: 5000
    });
    expect(orderResponse.status).toBe(201);
    
    // 3. Process payment
    const paymentResponse = await processPayment(clientToken, orderResponse.body.orderId);
    expect(paymentResponse.status).toBe(200);
    
    // 4. Upload deliverable
    const uploadResponse = await uploadDeliverable(lawyerToken, orderResponse.body.orderId);
    expect(uploadResponse.status).toBe(201);
    
    // 5. Accept deliverable
    const acceptResponse = await acceptDeliverable(clientToken, uploadResponse.body.deliverableId);
    expect(acceptResponse.status).toBe(200);
    
    // 6. Release funds
    const releaseResponse = await releaseFunds(clientToken, orderResponse.body.orderId);
    expect(releaseResponse.status).toBe(200);
  });
});
```

### **Test Setup**

#### **Test Configuration**
```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### **Test Database Setup**
```javascript
// backend/tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## 🖥️ **Frontend Testing**

### **Component Tests (React Testing Library)**

#### **1. Payment Form Tests**
```javascript
// frontend/src/components/__tests__/PaymentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../PaymentForm';

const mockStripe = {
  createPaymentMethod: jest.fn(),
  confirmCardPayment: jest.fn()
};

describe('PaymentForm', () => {
  test('renders payment form correctly', () => {
    render(
      <Elements stripe={mockStripe}>
        <PaymentForm lawyerId="lawyer123" />
      </Elements>
    );
    
    expect(screen.getByText('Service Details')).toBeInTheDocument();
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
  });
  
  test('calculates total with GST correctly', async () => {
    render(
      <Elements stripe={mockStripe}>
        <PaymentForm lawyerId="lawyer123" />
      </Elements>
    );
    
    const amountInput = screen.getByLabelText('Amount (₹)');
    fireEvent.change(amountInput, { target: { value: '10000' } });
    
    await waitFor(() => {
      expect(screen.getByText('₹11,800')).toBeInTheDocument(); // 10000 + 290 + 1510
    });
  });
});
```

#### **2. Order Management Tests**
```javascript
// frontend/src/components/__tests__/OrderManagement.test.tsx
describe('OrderManagement', () => {
  test('displays orders for client', async () => {
    const mockOrders = [
      {
        _id: '1',
        orderId: 'ORD-123',
        status: 'completed',
        totalAmount: 5000,
        lawyer: { name: 'John Doe' }
      }
    ];
    
    jest.spyOn(api, 'get').mockResolvedValue({ data: { orders: mockOrders } });
    
    render(<OrderManagement userRole="client" userId="client123" />);
    
    await waitFor(() => {
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### **Dashboard Integration Tests**
```javascript
// frontend/src/pages/__tests__/ClientDashboard.test.tsx
describe('ClientDashboard', () => {
  test('integrates payment functionality', async () => {
    const mockUser = { id: '123', role: 'client', name: 'Test Client' };
    
    render(
      <AuthProvider value={{user: mockUser}}>
        <ClientDashboard />
      </AuthProvider>
    );
    
    const newPaymentButton = screen.getByText('New Payment');
    fireEvent.click(newPaymentButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create Secure Payment')).toBeInTheDocument();
    });
  });
});
```

---

## 🔗 **End-to-End Testing (Cypress)**

### **E2E Test Configuration**
```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then(response => {
    localStorage.setItem('token', response.body.token);
  });
});

Cypress.Commands.add('createStripeTestPayment', (amount) => {
  cy.get('[data-testid="amount-input"]').type(amount);
  cy.get('[data-testid="service-select"]').select('consultation');
  cy.get('[data-testid="description-input"]').type('Test legal service');
  
  // Use Stripe test card
  cy.get('.StripeElement--focus').type('4242424242424242');
  cy.get('[data-testid="pay-button"]').click();
});
```

### **Complete User Journeys**
```javascript
// cypress/e2e/payment-flow.cy.js
describe('Payment Flow', () => {
  it('completes full escrow payment process', () => {
    // Client login and create payment
    cy.login('client@example.com', 'password');
    cy.visit('/dashboard/client');
    
    cy.get('[data-testid="new-payment-button"]').click();
    cy.get('[data-testid="lawyer-select"]').select('John Doe');
    cy.createStripeTestPayment('5000');
    
    cy.contains('Payment successful').should('be.visible');
    
    // Lawyer login and upload deliverable
    cy.login('lawyer@example.com', 'password');
    cy.visit('/dashboard/lawyer');
    
    cy.get('[data-testid="upload-work-button"]').click();
    cy.get('input[type="file"]').selectFile('test-document.pdf');
    cy.get('[data-testid="upload-submit"]').click();
    
    // Client accepts deliverable
    cy.login('client@example.com', 'password');
    cy.visit('/orders');
    
    cy.get('[data-testid="accept-deliverable"]').click();
    cy.contains('Work completed satisfactorily').should('be.visible');
    
    cy.get('[data-testid="release-funds"]').click();
    cy.contains('Funds released').should('be.visible');
  });
});
```

---

## 🔍 **Performance Testing**

### **Load Testing (k6)**
```javascript
// tests/performance/api-load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 }
  ]
};

export default function() {
  let response = http.get('http://localhost:5000/api/orders');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
}
```

---

## 🐛 **Manual Testing Checklists**

### **Payment System Testing**
- [ ] Lawyer Stripe account creation
- [ ] Payment form validation
- [ ] Successful payment processing
- [ ] Failed payment handling
- [ ] Webhook event processing
- [ ] Escrow fund holding
- [ ] Deliverable upload/download
- [ ] Fund release after acceptance
- [ ] Dispute initiation
- [ ] Refund processing

### **User Interface Testing**
- [ ] Dashboard responsiveness
- [ ] Navigation between sections
- [ ] Form validation messages
- [ ] Loading states
- [ ] Error handling
- [ ] Real-time updates

### **Security Testing**
- [ ] Authentication required for protected routes
- [ ] Role-based access control
- [ ] JWT token expiration
- [ ] File upload security
- [ ] Payment data encryption
- [ ] Webhook signature verification

---

## 📊 **Test Automation Pipeline**

### **GitHub Actions CI/CD**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: cypress-io/github-action@v2
        with:
          working-directory: frontend
          start: npm run dev
          wait-on: 'http://localhost:5173'
```

---

## 🚀 **Running Tests**

### **Backend Tests**
```bash
cd backend

# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### **Frontend Tests**
```bash
cd frontend

# Unit/Component tests
npm test

# E2E tests
npm run cypress:run

# Coverage
npm run test:coverage
```

### **Manual Testing**
1. Start both backend and frontend servers
2. Test user registration and login
3. Create lawyer Stripe account
4. Process test payment with card `4242424242424242`
5. Upload deliverables and test acceptance flow
6. Verify webhook processing in Stripe dashboard

---

## 📋 **Test Coverage Goals**

- **Backend Controllers**: 90%+ coverage
- **Frontend Components**: 85%+ coverage  
- **API Endpoints**: 100% tested
- **Payment Flows**: 100% E2E coverage
- **Error Scenarios**: Comprehensive error handling tests

This testing guide ensures the Judicature platform maintains high quality and reliability across all features, especially the critical payment and escrow functionality.