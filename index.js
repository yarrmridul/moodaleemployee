console.log("🔧 Starting server setup...");
console.log("Loaded ENV variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("PORT:", process.env.PORT);
const session = require("express-session");


const fs = require("fs");
const path = require("path");

const express = require("express");
require("dotenv").config();
//https://freedb.tech/dashboard/
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const nodemailer = require("nodemailer");

const cors = require("cors");
app.use(cors());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.post("/admin/employee/send-mail/:email", async (req, res) => {
  const employeeEmail = req.params.email;
  try {
    const [rows] = await connection
      .promise()
      .query("SELECT * FROM employeedata WHERE email = ?", [employeeEmail]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employee = rows[0];

    // Ignore these fields
    const ignoreFields = ["contract_end", "comments"];
    const missingFields = [];

    // Check for empty required fields
    for (const key in employee) {
      if (
        !ignoreFields.includes(key) &&
        (employee[key] === null ||
          employee[key] === "" ||
          employee[key] === undefined)
      ) {
        missingFields.push(key);
      }
    }

    // Don't send if everything's filled
    if (missingFields.length === 0) {
      return res
        .status(200)
        .json({ message: "No missing fields. Email not sent." });
    }

    // Format all details
    let detailsText = "";
    for (const key in employee) {
      detailsText += `${key}: ${employee[key] || "N/A"}\n`;
    }

    // Format missing field request
    const missingRequest = missingFields.length
      ? `We require the following details from your end:\n${missingFields.join(
          ", "
        )}\n\n`
      : "";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // Use TLS
      secure: false, // MUST be false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: "moodale2020@gmail.com",
      to: employee.email,
      subject: "Moodale Login Credentials & Info Update Request",
      text: `Hey ${employee.name},\n\nThese are your Moodale login credentials. In case of any query, mail back.

Email: ${employee.email}
Pass: ${employee.password}

And these are your information registered with us. Please let us know if you want to update anything:

${detailsText}

${missingRequest}Thanks,  
Moodale`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Mail sent successfully" });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ message: "Failed to send mail" });
  }
});

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

const port = process.env.PORT;
if (!port) {
  console.error("❌ PORT environment variable is not set");
  process.exit(1);
}

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, "certs", "ca.pem")), // <-- ADD THIS
    rejectUnauthorized: true, // Aiven requires this
  },
});

connection.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err.message);
    process.exit(1); // Prevent server from starting
  } else {
    console.log("✅ MySQL Connected Successfully");
  }
});

console.log("Starting server...");

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/admin", (req, res) => {
  res.render("adminindex.ejs");
});

app.get("/adminlogin", (req, res) => {
  res.render("login.ejs");
});

app.post("/adminlogin", (req, res) => {
  const formmail = req.body.email;
  const formpass = req.body.password;
  const q = "SELECT * FROM admin WHERE email = ? ";
  try {
    connection.query(q, [formmail, formpass], (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
       // return res.send("Invalid credentials"); // no matching user found
        return res.render("login", { error: "Invalid email or password" });

      }
      let user = results[0];

      // Optional re-checking, but not needed as SQL already filtered it
      if (formmail === user.email && formpass === user.password) {
        res.render("adminindex.ejs", { user });
      } else {
      //  res.send("Invalid credentials");
              res.render("login", { error: "Invalid email or password" });

      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.render("login", { error: "Something went wrong. Try again later." });
  }
});

app.get("/admin/task", (req, res) => {
  res.render("task.ejs");
});

app.get("/admin/task/add", (req, res) => {
  res.render("assign.ejs");
});

app.get("/admin/leave", (req, res) => {
  res.render("leave.ejs");
});

app.get("/admin/meeting", (req, res) => {
  res.render("meeting.ejs");
});

//to add new employees
app.post("/admin/employee", (req, res) => {
  let {
    name,
    email,
    contact_number,
    address,
    password,
    joining_date,
    department,
    role,
    contract_end,
    city,
    gender,
    date_of_birth,
    profile_picture,
    comments,
  } = req.body;

  // ✅ Convert empty optional fields to null
  if (!contract_end) contract_end = null;
  if (!date_of_birth) date_of_birth = null;

  const q = `
    INSERT INTO employeedata
    (name, email, contact_number, address,
     password, joining_date, department, role,
     contract_end, city, gender, date_of_birth,
     profile_picture, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    q,
    [
      name,
      email,
      contact_number,
      address,
      password,
      joining_date,
      department,
      role,
      contract_end,
      city,
      gender,
      date_of_birth,
      profile_picture,
      comments,
    ],
    (err, results) => {
      if (err) {
        console.error("Error adding employee:", err);
        return res.status(500).send("Error adding employee");
      }
      res.redirect("/admin/employee");
    }
  );
});

//show all employees
app.get("/admin/employee", (req, res) => {
  let q = "SELECT * FROM employeedata";
  connection.query(q, (err, results) => {
    if (err) {
      console.error("Error fetching employees:", err);
      return res.status(500).send("Error fetching employees");
    }
    console.log("Query Results:", results);

    res.render("employee.ejs", { results }); // ✅ even an empty array avoids the crash
  });
});

app.get("/admin/employee/fetch", async (req, res) => {
  const query = req.query.query;
  const [rows] = await connection
    .promise()
    .query("SELECT * FROM employeedata WHERE email = ? OR id = ?", [
      query,
      query,
    ]);
  res.json(rows[0] || {});
});

app.post("/admin/employee/update", async (req, res) => {
  let {
    id,
    name,
    contact_number,
    email,
    password,
    joining_date,
    department,
    role,
    contract_end,
    city,
    gender,
    date_of_birth,
    address,
    profile_picture,
    comments,
  } = req.body;

  // Convert empty date fields to null
  if (!contract_end) contract_end = null;
  if (!date_of_birth) date_of_birth = null;
  if (!joining_date) joining_date = null;

  await connection.promise().query(
    `UPDATE employeedata SET name=?, contact_number=?, email=?, password=?, joining_date=?,
     department=?, role=?, contract_end=?, city=?, gender=?, date_of_birth=?, address=?, profile_picture=?, comments=? WHERE id=?`,
    [
      name,
      contact_number,
      email,
      password,
      joining_date,
      department,
      role,
      contract_end,
      city,
      gender,
      date_of_birth,
      address,
      profile_picture,
      comments,
      id,
    ]
  );

  res.redirect("/admin/employee");
});

app.post("/admin/employee/delete", async (req, res) => {
  const id = req.body.id;
  if (!id) return res.status(400).send("ID is required");

  try {
    const [result] = await connection
      .promise()
      .query("DELETE FROM employeedata WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Employee not found");
    }

    res.redirect("/admin/employee");
  } catch (err) {
    console.error("MySQL Delete Error:", err);
    res.status(500).send("Error deleting employee");
  }
});

app.get("/admin/employee/all", async (req, res) => {
  try {
    const [rows] = await connection
      .promise()
      .query("SELECT id, name, email FROM employeedata");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all employees:", err);
    res.status(500).json([]);
  }
});
//



//=========================================================employee portal==================================================================

app.get("/emplogin", (req, res) => {
  res.render("elogin.ejs", { error: null }); // pass null if no error
});

app.get("/emp", async (req, res) => {
  if (!req.session.email) {
    console.warn("No session email found. Redirecting to login.");
    return res.redirect("/emplogin");
  }

  try {
    // ✅ Fetch employee based on session email
    const [users] = await connection.promise().query(
      "SELECT * FROM employeedata WHERE email = ?",
      [req.session.email]
    );

    if (!users || users.length === 0) {
      console.warn("No employee found for session email:", req.session.email);
      return res.redirect("/emplogin");
    }

    const employee = users[0]; // ✅ Store employee

    // ✅ Create single-task array from employee fields
    const updates = [
      {
        title: employee.recent_update_title,
        tag: employee.recent_update_tag,
        description: employee.recent_update_description,
        date: employee.recent_update_date,
      },
    ];

    const tasks = [
      {
        name: employee.task_name,
        client: employee.task_client,
        assigned: employee.name,
        details: employee.task_details,
        status: employee.task_status,
        deadline: employee.task_deadline,
      },
    ];

    // ✅ Render dashboard with all values
    res.render("empindex.ejs", {
      employee,
      updates,
      tasks,
    });
  } catch (err) {
    console.error("Error in /emp route:", err);
    res.status(500).send("Server error");
  }
});


app.post("/emplogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await connection.promise().query(
      "SELECT * FROM employeedata WHERE email = ? AND password = ?",
      [email, password]
    );

    if (users.length === 0) {
      return res.render("elogin.ejs", {
        error: "Invalid email or password",
      });
    }

    const user = users[0];
    req.session.email = user.email;
    req.session.empID = user.id;

    res.redirect("/emp");
  } catch (err) {
    console.error("Error during login:", err);
    res.render("elogin.ejs", {
      error: "Something went wrong. Please try again.",
    });
  }
});



app.get("/emp/meeting", (req, res) => {
  res.render("empmeeting.ejs", {
    meetings: [
      {
        title: "Marketing Sync-up",
        description: "Discuss Q3 strategy and campaigns.",
        date: "2025-08-03",
        time: "11:00 AM",
        link: "https://zoom.com/j/123456",
      },
      {
        title: "Client Review",
        description: "Review deliverables with Acme Corp.",
        date: "2025-08-05",
        time: "2:00 PM",
        link: "https://meet.google.com/xyz-defg-hij",
      },
    ],
  });
});

app.get("/emp/leave", (req, res) => {
res.render('empleave.ejs', {
  leaves: [
    {
      start: '2025-08-01',
      end: '2025-08-03',
      type: 'Sick',
      status: 'Approved',
      submitted: '2025-07-28'
    },
    {
      start: '2025-08-10',
      end: '2025-08-12',
      type: 'Casual',
      status: 'Pending',
      submitted: '2025-07-29'
    }
  ]
});
});

