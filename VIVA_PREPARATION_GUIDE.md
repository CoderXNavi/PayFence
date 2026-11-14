# PayFence: Viva Examination Preparation Guide

This guide contains quick-reference notes, an elevator pitch, a timed live demonstration script, and direct answers to 10 common technical questions asked by viva examiners.

---

## 1. One-Minute Elevator Pitch

> "PayFence is an API security gateway and deterministic policy inspection engine designed for automated payment workflows and autonomous AI agent transactions.
> 
> As software agents begin initiating financial micro-payments, standard Web Application Firewalls fall short because they only inspect syntax like SQL injection or cross-site scripting. They do not understand payment logic, such as transaction velocity, daily cumulative budgets, recipient whitelists, or parameter tampering like negative amounts.
> 
> PayFence sits between client agents and downstream ledger services. It converts currency into integer micro-units to eliminate floating-point rounding bugs, validates transaction boundaries against strict per-transaction and daily limits, checks recipient whitelists, validates origin headers, and verifies nonces to prevent replay attacks.
> 
> In our evaluation, we tested PayFence against 28 adversarial attack scenarios across five OWASP API Security categories. The gateway blocked all 28 attacks without blocking our legitimate control transaction, achieving a 100% defense rate with zero false positives."

---

## 2. 45-Second Live Demo Walkthrough Script

Follow this sequence during your live presentation:

### Step 1: Login & Status Check (0:00 – 0:10)
- Launch the project using `run-demo.bat`.
- The browser opens at `http://localhost:5173`.
- Click the **Quick Demo Login** button (pre-filled with `admin@college.edu`).
- Point to the top status bar:
  > *"Here on the Dashboard, we can see our mock wallet has an initial balance of $500.00, our daily budget is set to $200.00, and the deterministic policy guard is active."*

### Step 2: Interactive Attack Inspection (0:10 – 0:25)
- Click **Playground** on the sidebar.
- In the scenario dropdown, select **"Negative Amount Attack (-$25.00)"**.
- Click **Send Test Payload**.
- Point to the response panel:
  > *"The gateway intercepts the payload before it touches the ledger. Because the amount is negative, it returns HTTP 403 Forbidden with the violation code `INVALID_AMOUNT_NEGATIVE_OR_ZERO`. The wallet balance remains untouched."*

### Step 3: Automated Red Team Audit (0:25 – 0:35)
- Click **Red Team Simulator** on the sidebar.
- Click **Run Security Audit**.
- The 29-test matrix executes in real time.
- Point to the score banner:
  > *"Here our Red Team runner executes 28 distinct adversarial attack vectors covering BOLA, limit bypasses, input tampering, origin spoofing, and replay attacks, plus one legitimate control transaction. The gateway achieves a 100% defense score: 28 attacks blocked and 1 legitimate transaction approved."*

### Step 4: Forensic Audit Log (0:35 – 0:45)
- Click **Audit Logs** on the sidebar.
- Point to the top rows:
  > *"Every rejected and approved transaction is recorded in this chronological audit log with client IP, timestamp, rejection code, and payload details, providing a complete forensic record."*

---

## 3. Direct Answers to 10 Tough Examiner Questions

### Question 1: What is BOLA/IDOR, and how does PayFence mitigate it?
**Answer:**  
BOLA (Broken Object Level Authorization), previously called Insecure Direct Object Reference (IDOR), happens when an API endpoint accepts an account or user identifier in the request body without checking whether the authenticated user actually owns that account. For example, User A sends a payment payload specifying `sender: "user_B"`.  
PayFence prevents this by extracting the verified user identity directly from the signed JWT token (`req.user.id`) and strictly comparing it against the `sender` field in the payload. If the caller tries to debit an account that does not match their authenticated token identity, the gateway rejects the request with HTTP 403 and the error code `BOLA_UNAUTHORIZED_SENDER`.

---

### Question 2: Why did you use an in-memory/JSON store instead of an enterprise relational database like PostgreSQL?
**Answer:**  
For an academic demonstration and local testing, relying on a local JSON file and in-memory store ensures that the project runs on any evaluator's computer with only Node.js installed, avoiding the requirement to configure a local PostgreSQL or MySQL service.  
Architecturally, the datastore module in `src/config/database.js` uses an adapter pattern. If a `MONGODB_URI` connection string is set in the environment variables, the system connects directly to MongoDB Atlas. The security guard logic itself is completely decoupled from the persistence layer, meaning the storage implementation can be swapped without modifying any policy inspection code.

---

### Question 3: How does the gateway stop integer underflow, overflow, and negative transaction amounts?
**Answer:**  
- **Negative amounts:** The policy guard checks `typeof amount === 'number'`, `Number.isFinite(amount)`, and `amount >= minTxAmountUSD` ($0.01). Any zero or negative value is rejected immediately. If negative numbers were permitted, subtracting a negative amount from a balance would invert into addition, allowing an attacker to artificially create funds.
- **Overflow and large integers:** JavaScript numbers are 64-bit double-precision floats, which are safe for integers up to `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$, approximately $9 \times 10^{15}$). The policy guard enforces an upper boundary of `perTxCapUSD` ($50.00). Any value exceeding $50.00, scientific notation like `"1e308"`, or `Infinity` is caught by numeric finite checks and boundary comparisons.

---

### Question 4: How are transaction replay attacks mitigated?
**Answer:**  
A replay attack occurs when an attacker captures a legitimate transaction payload and re-submits it to execute duplicate charges.  
PayFence mitigates this with two checks:
1. **Nonce Verification:** Every payment request requires a unique `nonce`. The gateway tracks used nonces in a memory cache. If a nonce has already been processed within the active session window, the request is rejected with `REPLAY_ATTACK_DETECTED`.
2. **Timestamp Window:** Each request includes a client timestamp. The gateway verifies that $| \text{currentTime} - \text{clientTimestamp} | \le 300{,}000\text{ ms}$ (5 minutes). Requests older than 5 minutes or with timestamps far in the future are discarded.

---

### Question 5: What happens when a request comes from an unauthorized origin or spoofed header?
**Answer:**  
Web browsers automatically attach the `Origin` header during cross-origin HTTP requests. If an attacker hosts a malicious website trying to trigger API calls to PayFence on behalf of a victim, their domain appears in the `Origin` header.  
PayFence validates the `Origin` header against an explicit list of allowed domains (`allowedOrigins`). If the header contains an untrusted domain, is set to `null`, or is omitted in cross-origin contexts, the gateway rejects the request with HTTP 403 `ORIGIN_UNAUTHORIZED` before any payment processing logic runs.

---

### Question 6: Why is rate limiting and daily budget enforcement done at the gateway level rather than inside the client?
**Answer:**  
The client application runs on the user's machine or external agent runtime, which is outside the application's trust boundary. Anyone can inspect client-side code, modify JavaScript in developer tools, or send requests directly using `curl`, Postman, or custom Python scripts, completely bypassing client-side checks.  
Enforcing velocity, transaction caps, and daily budgets on the server gateway ensures that all transactions are validated under identical rules, regardless of which client or script transmitted them.

---

### Question 7: How does the policy engine handle floating-point precision issues (e.g., $0.10 + $0.20 != $0.30)?
**Answer:**  
In standard IEEE 754 floating-point arithmetic used by JavaScript, `0.1 + 0.2` evaluates to `0.30000000000000004`. In financial calculations, these minute rounding errors can break strict equality comparisons or lead to accumulated balance drift.  
PayFence solves this by scaling all monetary values into integer micro-units:
$$\text{Units} = \text{round}(\text{Amount}_{\text{USD}} \times 10{,}000)$$
$1.00 equals 10,000 units, and $0.10 equals 1,000 units. All additions, subtractions, limit comparisons, and budget tallies are calculated using standard integer arithmetic. The value is only converted back to a floating-point dollar string when preparing the final response JSON for display.

---

### Question 8: Can an attacker bypass the gateway by making direct calls to the ledger database?
**Answer:**  
In a production deployment, the database and internal ledger services are placed in an isolated private network subnet or behind an internal VPC firewall without public IP addresses. Only the PayFence gateway instance has network permissions to connect to the database port.  
In our demonstration architecture, the ledger modification routines are only exposed through the `/api/gateway/pay` endpoint. The client never receives direct database connection parameters.

---

### Question 9: How does the Red Team test harness run, and how are the 28 attack cases structured?
**Answer:**  
The test harness (`auditEngine.js` and `securityGuard.test.js`) is an automated testing module that executes 28 distinct adversarial attack cases alongside 1 legitimate control case.  
The test cases are grouped into five functional categories:
1. **BOLA / IDOR (6 cases):** Attempting to debit accounts belonging to other users, tenant hopping, and forged delegation.
2. **Business Logic & Limits (6 cases):** Exceeding the $50 transaction cap, exceeding the $200 daily budget, and balance exhaustion.
3. **Input Validation (6 cases):** Submitting negative values, strings, `NaN`, floating-point rounding exploits, prototype pollution, and SQL injection strings.
4. **Origin Spoofing (5 cases):** Submitting requests with untrusted domains, null origins, missing origins, or spoofed headers.
5. **Protocol Integrity (5 cases):** Replaying nonces, submitting expired timestamps, and unwhitelisted recipients.
Plus 1 legitimate control scenario verifying regular valid payments pass without issue.

For each test, the harness feeds the payload to the security guard and asserts that the returned HTTP status code and violation error match expected defensive outputs.

---

### Question 10: If this system were deployed in production, what additional security layers would you add?
**Answer:**  
If scaling PayFence to an enterprise production environment, we would add:
1. **Mutual TLS (mTLS):** Enforcing cryptographic client certificates so that autonomous agent machines must authenticate at the transport layer before initiating connections.
2. **Hardware Security Module (HSM) or Cloud KMS:** Storing encryption keys and signing private keys in dedicated tamper-resistant hardware rather than environment files.
3. **Distributed In-Memory Store (Redis Cluster):** Replacing the local memory cache with Redis for tracking nonces and sliding-window rate limits across multiple load-balanced gateway nodes.
4. **Cloud WAF and DDoS Protection:** Placing Cloudflare or AWS WAF in front of the gateway to filter volumetric Layer 7 network attacks before they reach Node.js.
5. **Message Queues:** Using Apache Kafka or RabbitMQ to decouple policy inspection from downstream bank settlement, ensuring reliability under high burst loads.
