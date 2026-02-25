const express = require('express');
const { Pool } = require('pg'); 
const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hoanthuong_db',
    password: 'quannguyen123@',
    port: 5432,
});


app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống Database!" });
    }
});

app.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email || name.trim() === "" || email.trim() === "") {
            return res.status(400).json({ 
                error: "Thieu hoac khong du thong tin." 
            });
        }

        const checkExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkExist.rows.length > 0) {
            return res.status(409).json({ 
                error: "Email nay ton tai!" 
            });
        }

        const insertQuery = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(insertQuery, [name, email]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống Database!" });
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                error: "Yeu cau that bai.Phai nhap noi dung can chinh sua." 
            });
        }

        const id = parseInt(req.params.id);

        const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).send('Khong tim thay nguoi dung!');
        }

        const currentUser = checkUser.rows[0];
        const updatedName = req.body.name !== undefined ? req.body.name : currentUser.name;
        const updatedEmail = req.body.email !== undefined ? req.body.email : currentUser.email;

        const updateQuery = 'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(updateQuery, [updatedName, updatedEmail, id]);

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "Email nay ton tai!" });
        }
        res.status(500).json({ error: "Lỗi hệ thống Database!" });
    }
});


app.delete('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ 
                error: "Khong co ID nay de xoa." 
            });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.send('Da xoa nguoi dung thanh cong');
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống Database!" });
    }
});

app.listen(PORT, () => {
    console.log(`Sever dang chay tai http://localhost:${PORT}`);
});