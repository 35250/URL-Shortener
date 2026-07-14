# 🔗 URL Shortener API

A production-ready REST API for shortening URLs using **Node.js**, **Express**, and **PostgreSQL**.

This project was built to understand backend engineering fundamentals beyond CRUD applications by focusing on API design, relational databases, production deployment, concurrency-safe ID generation, and cloud deployment.

**Live API**

https://url-shortener-xdq0.onrender.com

---

# Features

* Generate short URLs through a REST API
* Redirect users using shortened URLs
* Base62 encoding for compact URL generation
* PostgreSQL-backed persistent storage
* Connection pooling using the `pg` driver
* Centralized error handling
* Environment-based configuration
* Cloud deployment on Render
* Production PostgreSQL database
* Concurrency tested using ApacheBench

---

# Tech Stack

| Technology | Purpose                                |
| ---------- | -------------------------------------- |
| Node.js    | Runtime                                |
| Express.js | REST API                               |
| PostgreSQL | Relational Database                    |
| pg         | PostgreSQL driver & connection pooling |
| dotenv     | Environment configuration              |
| Render     | Deployment                             |

---

# API Endpoints

## Shorten URL

```
POST /shorten
```

Request

```json
{
    "url":"https://example.com"
}
```

Response

```json
{
    "shortUrl":"https://url-shortener-xdq0.onrender.com/aaaaae"
}
```

---

## Redirect

```
GET /:shortCode
```

Example

```
GET /aaaaae
```

The endpoint responds with an HTTP redirect to the original URL.

---

# Engineering Decisions

## 1. Why PostgreSQL instead of MongoDB?

The project maintains a deterministic relationship between

```
Original URL
        ↓
Database ID
        ↓
Base62 Short Code
```

A relational database naturally models this relationship while providing:

* ACID guarantees
* Native sequences
* Strong consistency
* Efficient indexing

---

## 2. Database-Generated IDs

The application **does not generate IDs itself.**

Instead, PostgreSQL's native sequence object generates every new ID.

Benefits

* No duplicate IDs
* No application-level locking
* Race-condition resistant
* Scales naturally for concurrent inserts

---

## 3. Base62 Encoding

Instead of storing random strings, the database ID is converted into a Base62 representation.

Example

```
125

↓

cb
```

Advantages

* Short URLs
* URL-safe
* Deterministic
* Reversible

---

## 4. Connection Pooling

The application uses PostgreSQL connection pooling through the `pg` driver instead of opening a new database connection for every request.

Benefits

* Lower connection overhead
* Better scalability
* Improved throughput
* Efficient resource utilization

---

## 5. Environment Variables

Configuration is completely separated from source code.

Examples

* Database credentials
* Host
* Password
* Base URL

This keeps secrets outside the repository and simplifies deployment.

---

# Deployment

The API is deployed on **Render**.

Deployment included

* Production PostgreSQL database
* Environment variable configuration
* Automatic GitHub deployments

---

# Concurrency Benchmark

ApacheBench was used to evaluate the deployed redirect endpoint.

Command

```bash
ab -n 1000 -c 50 https://url-shortener-xdq0.onrender.com/aaaaae
```

Results

| Metric                 | Value    |
| ---------------------- | -------- |
| Total Requests         | 1000     |
| Concurrent Connections | 50       |
| Failed Requests        | 0        |
| Requests/sec           | 87.50    |
| Total Benchmark Time   | 11.429 s |

The benchmark verified that the deployed API remained stable while serving concurrent traffic without request failures.

---

# Project Structure

```
.
├── config
├── controllers
├── database
├── routes
├── utils
├── index.js
├── package.json
└── README.md
```

---

# Running Locally

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Create a `.env`

```env
PORT=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
BASE_URL=
```

Run

```bash
npm start
```

---

# Architecture Diagram

Client
   │
POST /shorten
   │
Express Server
   │
PostgreSQL
   │
Base62 Encoder
   │
Short URL

---

# Author

**Ayan Dey**

LinkedIn

https://www.linkedin.com/in/ayandey212105242

Live API

https://url-shortener-xdq0.onrender.com

