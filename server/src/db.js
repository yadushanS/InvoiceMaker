const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'invoice_maker',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      abn VARCHAR(64) DEFAULT '',
      phone VARCHAR(64) DEFAULT '',
      contactEmail VARCHAR(255) DEFAULT '',
      logoUrl VARCHAR(512) DEFAULT '',
      themeColors TEXT,
      bankAccountHolder VARCHAR(255) DEFAULT '',
      bankName VARCHAR(255) DEFAULT '',
      bankBsb VARCHAR(64) DEFAULT '',
      bankAccountNo VARCHAR(64) DEFAULT '',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id CHAR(36) PRIMARY KEY,
      businessId CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_folders_business FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE,
      INDEX idx_folders_business (businessId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id CHAR(36) PRIMARY KEY,
      businessId CHAR(36) NOT NULL,
      folderId CHAR(36) NOT NULL,
      data LONGTEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_invoices_business FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_invoices_folder FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE,
      INDEX idx_invoices_business (businessId),
      INDEX idx_invoices_folder (folderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

module.exports = { pool, initSchema };
