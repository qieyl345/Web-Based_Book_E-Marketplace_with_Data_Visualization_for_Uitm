# 4.2 Project Design

This section outlines the architectural design of the UITM-EMPLC system, detailing user interactions, system workflows, and data structures.

## 4.2.1 Use Case Diagram (UCD)

The Use Case Diagram illustrates the primary actors (Student/Staff as Buyer/Seller, and Admin) and their interactions with the system.

```mermaid
flowchart LR
    User["User (Student/Staff)"]
    Admin["Admin"]

    subgraph System["UITM-EMPLC System"]
        direction TB
        UC1(["Login / Sign Up"])
        UC2(["Manage Profile"])
        
        UC3(["Browse/Search Books"])
        UC4(["View Book Details"])
        UC5(["Add to Cart"])
        UC6(["Purchase Books"])
        UC7(["View Receipt"])
        
        UC8(["List Book for Sale"])
        UC9(["Manage Listings"])
        UC10(["Chat/Negotiate"])
        
        UC11(["Manage Users"])
        UC12(["Manage Books"])
        UC13(["View Analytics & Health"])
        UC14(["Manage Feedback"])
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10

    Admin --> UC1
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
```

### Actors Description
1. **User (Student/Staff)**: Can act as both Buyer and Seller.
   - **Buyer Role**: Browses books, adds to cart, makes purchases, and chats with sellers.
   - **Seller Role**: Lists books, manages inventory, and responds to potential buyers.
2. **Admin**: Manages the overall system, including user monitoring, content moderation (books/feedback), and viewing analytical dashboards.

---

## 4.2.2 System Flowchart

The System Flowchart demonstrates the core workflow of a user purchasing a book, which is the primary value proposition of the system.

### Purchase Flow
```mermaid
flowchart TD
    Start([Start]) --> Login{User Logged In?}
    Login -- No --> LoginPage[Redirect to Login Page]
    LoginPage --> Auth[Authenticate]
    Auth --> RedirectCart[Redirect back to Cart/Book]
    
    Login -- Yes --> Browse[Browse/Search Books]
    Browse --> ViewDetails[View Book Details]
    ViewDetails --> AddCart[Add to Cart]
    AddCart --> ViewCart[View Shopping Cart]
    
    ViewCart --> CheckAvailability{Check Availability}
    CheckAvailability -- Sold/Unavailable --> RemoveItem[Remove Item & Notify]
    RemoveItem --> ViewCart
    
    CheckAvailability -- Available --> Checkout[Proceed to Checkout]
    Checkout --> SelectBank[Select Payment Bank]
    SelectBank --> ProcessPayment["Process Payment (FPX Simulation)"]
    
    ProcessPayment --> Success{Payment Success?}
    Success -- No --> FailMsg[Show Failure Message]
    FailMsg --> TryAgain{Try Again?}
    TryAgain -- Yes --> ProcessPayment
    TryAgain -- No --> ViewCart
    
    Success -- Yes --> CreateTxn[Create Transaction Record]
    CreateTxn --> UpdateBook[Update Book Status to 'Sold']
    UpdateBook --> Escrow[Escrow: Hold Funds]
    Escrow --> GenReceipt[Generate Receipt]
    
    GenReceipt --> Delivery{Item Delivered?}
    Delivery -- Yes --> ConfirmRx[Buyer Confirms Receipt]
    ConfirmRx --> WarrantyStart[7-Day Warranty Starts]
    
    WarrantyStart --> Issues{Any Issues?}
    Issues -- No (7 Days) --> AutoPayout[Auto-Payout to Seller]
    Issues -- Yes --> Dispute[Open Dispute/Claim]
    
    Dispute --> AdminAction[Admin Resolution]
    AdminAction -- Refund --> RefundBuyer[Refund Buyer]
    AdminAction -- Pay --> PaySeller[Pay Seller]
    
    AutoPayout --> End([End])
    RefundBuyer --> End
    PaySeller --> End
```

---

## 4.2.3 Entity Relationship Diagram (ERD)

The ERD visualizes the data structure within the Firebase Realtime Database, showing entities like Users, Books, Transactions, and their relationships.

```mermaid
erDiagram
    USERS ||--o{ BOOKS : "lists"
    USERS ||--o{ TRANSACTIONS : "makes"
    USERS ||--o{ OFFERS : "negotiates"
    USERS ||--o{ FEEDBACK : "gives/receives"

    BOOKS ||--o{ TRANSACTIONS : "included in"
    BOOKS ||--o{ OFFERS : "subject of"
    
    TRANSACTIONS ||--o{ FEEDBACK : "reviewed in"

    USERS {
        string uid PK
        string email
        string fullName
        string role "admin/student/staff"
        string phoneNumber
        boolean isSeller
        number totalSales
        number totalPurchases
        object wallet "{ balance, pendingEscrow, frozenDispute }"
    }

    BOOKS {
        string bookId PK
        string sellerId FK
        string title
        string author
        number price
        string condition
        string status "available/sold"
        number viewCount
        timestamp createdAt
        timestamp soldAt
    }

    TRANSACTIONS {
        string transactionId PK
        string buyerId FK
        string sellerId FK
        number amount
        number commissionFee
        string status "payment_held/delivered/completed/refunded"
        timestamp createdAt
        timestamp escrowHeldAt
        timestamp warrantyExpiresAt
        object[] items "Array of Book References"
    }

    OFFERS {
        string offerId PK
        string buyerId FK
        string sellerId FK
        string bookId FK
        number offerPrice
        string status "pending/accepted/rejected"
    }

    FEEDBACK {
        string feedbackId PK
        string buyerId FK
        string transactionId FK
        number rating
        string comment
        timestamp createdAt
    }
```

### Entity Descriptions
- **USERS**: Stores profile information and aggregate statistics. Key roles include `admin` and regular users (students/staff).
- **BOOKS**: Represents the listings. Contains details like `sellerId` (link to User) and `status` (tracks availability).
- **TRANSACTIONS**: Records successful purchases. Links a Buyer to one or more Books. Stores financial details and delivery status.
- **OFFERS**: Manages price negotiations between buyers and sellers.
- **FEEDBACK**: Reviews left by buyers after a transaction is completed.
