const express = require('express');
// const bodyParser = require('body-parser'); //Don't NEED to require('body-parser); for express 4.16+

const mysql = require('mysql2/promise');

const app = express();

const cors = require('cors');

require('dotenv').config();

// Establish the server connection
// PORT ENVIRONMENT VARIABLE
const port = process.env.PORT;

// MySQL details
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

// Configuring express server
// app.use(bodyParser.json()); //Don't NEED to require('body-parser); for express 4.16+
app.use(express.json()); //Used to parse JSON bodies

app.use(cors());

app.use(async function mysqlConnection(req, res, next) {
  console.log(req.url)
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await next();

    req.db.release();
  } catch (err) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    console.log(err)
    if (req.db) req.db.release();
    throw err;
  }
  console.log('Request Finished')
});

app.listen(port, () => console.log(`Listening on the port ${port}..`));

// Creating GET Router to fetch all the learner details from the MySQL Database
app.get('/learners', async (req, res) => {
  try {
    const [data] = await req.db.query(
      'SELECT * FROM learner_details'
    );
    res.json(data);
    console.log('/learners', data);
  } catch (err) {
    console.log('/learners', err);
  }
});

// Router to GET specific learner detail from the MySQL database
app.get('/learners/:id', async (req, res) => {
  try {
    const [data] = await req.db.query(
      'SELECT * FROM learner_details WHERE learner_id = :id',
      {
        id: req.params.id
      }
    );
    res.json(data);
    console.log('learners/:id', data);
  } catch (err) {
    console.log('/learners/":id', err);
  }
});

// GET specific learner list with search by name from the MySQL database
app.get('/learners-search/:name', async (req, res) => {
  console.log("Checking This" + req.params.name);
  try {
    const [data] = await req.db.query(
      'SELECT learner_name, learner_Id  FROM learner_details WHERE learner_name = :name',
      {
        name: req.params.name
      }
    );
    res.json(data);
    console.log('/learners-search/:name', data);
  } catch(err) {
    console.log('/learners-search/:name', err);
  }
});

// Router to INSERT/POST a learner's detail
app.post('/learners', async (req, res) => {
  console.log(req.body)
  try {
    const learners = await req.db.query(
      `INSERT INTO learner_details (
        learner_name,
        learner_email,
        course_Id
      ) VALUES (
        :learner_name,
        :learner_email,
        :course_Id
      )`,
      {
        learner_name: req.body.learner_name,
        learner_email: req.body.learner_email,
        course_Id: req.body.course_Id
      }
    );
    res.json(learners)
  } catch (err) {
    console.log('/post', err)
  }
});

// app.post('/learners', async (req, res) => {
//   try {
//     let learner = req.body;
//     const sql = `
//       SET @learner_id = ?; 
//       SET @learner_name = ?; 
//       SET @learner_email = ?; 
//       SET @course_Id = ?;
//       CALL learnerAddOrEdit(
//         @learner_id, 
//         @learner_name, 
//         @learner_email, 
//         @course_Id
//       );
//     `;
//     const [data] = await req.db.query(
//       sql, [
//         learner.learner_id, 
//         learner.learner_name, 
//         learner.learner_email, 
//         learner.course_Id
//       ]
//     )
//     if (!err) {
//       row.forEach(element => {
//         if (element.constructor === Array) {
//           res.json('New Learner ID :' + element[0].learner_id);
//         } else {
//           console.log('/learners', err)
//         }
//       })
//     }
//   } catch(err) {
//     console.log('/learners', err);
//   }
// });


// Router to UPDATE a learner's detail
app.put('/learners/:id', async (req, res) => {
  console.log(req.params)
  console.log("I'm in learners request Id")
  try {
    const [data] = await req.db.query(`
      UPDATE learner_details SET 
        learner_name = :learner_name, 
        learner_email = :learner_email,
        course_Id = :course_Id,
        available = :available
      WHERE learner_id = :learner_id
    `, {
      learner_name: req.body.learner_name,
      learner_email: req.body.learner_email,
      course_Id: req.body.course_Id,
      available: req.body.available,
      learner_id: req.params.id ? parseInt(req.params.id) : 0
    });
    res.json('Learner Details Updated Successfully');
  } catch(err) {
    console.log('/:learner_id', err);
  }
});

// Router to DELETE a learner's detail
app.delete('/learners/:id', async (req, res) => {
  try {
    const [data] = await req.db.query(`DELETE FROM learner_details WHERE learner_id = ?`, [req.params.id]);
    res.json(['Learner Details Deleted Successfully', data])
    console.log(data  + "was deleted");
    // res.send(202); // Can only use 1 res.json() or res.send()
  } catch(err) {
    console.log('/learners/:id', err);
  }
});

app.delete('/learners', async (req, res) => {
  try {
    const [data] = await req.db.query(`DELETE FROM learner_details WHERE 1`, [req.params.id]);
    res.json(['Learner Details Deleted Successfully', data])
    console.log(data  + "was deleted");
    // res.send(202); // Can only use 1 res.json() or res.send()
  } catch(err) {
    console.log('/learners/:id', err);
  }
});
