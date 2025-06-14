CREATE DATABASE moodale;
USE moodale;

CREATE TABLE admin (
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

SHOW TABLES;

INSERT INTO admin (email, password)
 VALUES ("mridulagrawal06@gmail.com","Pizzaboy@07");

 SELECT * FROM admin


UPDATE admin
SET password = "Pizzaboy@07"
WHERE email = "mridulagrawal06@gmail.com";

SELECT * FROM admin;

-- Then update the password
UPDATE admin
SET password = "Pizzaboy@07"
WHERE email = "mridulagrawal06@gmail.com";
SELECT * FROM admin;

CREATE TABLE employeedata (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    joining_date DATE NOT NULL,
    department VARCHAR(255) ,
    role VARCHAR(255) ,
    contract_end DATE ,
    city VARCHAR(255) ,
    contact_number VARCHAR(15) UNIQUE,
    gender VARCHAR(10),
    date_of_birth DATE,
    address TEXT,
    profile_picture VARCHAR(255),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

SHOW TABLES;