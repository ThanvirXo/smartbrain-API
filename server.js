import express from 'express';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const app=express();
app.use(express.json());
app.use(cors());


let db=knex({
client: 'pg',
  connection: {
    host : '127.0.0.1',
    port : process.env.port,
    user : 'postgres',
    password : process.env.postgres_password,
    database : 'smart-brain'
  }
})

var info=db.select('*').from('users').then(data=>console.log(data));



app.post('/signin',(req,res)=>{
    db.select('email','hash').from('login')
    .where('email','=',req.body.email)
    .then(data=>{
       const isValid=bcrypt.compareSync(req.body.password,data[0].hash);
       if(isValid){
        return db.select('*').from('users')
        .where('email','=',req.body.email)
        .then(user=>{
            
            res.json(user[0])
        })
        .catch(err=>{
            res.status(404).json('unable to get the user')
        })
       }
       else{
        res.status(400).json('Invalid credentials')
       }
    })
    .catch(err=>{
        res.status(400).json('wrong credentials')
    })
})

app.post('/register',(req,res)=>{
    const {email,name,password}=req.body
    // bcrypt.hash(password, null, null, function(err, hash) {
    //     console.log(hash)
    // });
    const hash = bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
        return trx('users')
            .returning('*')
            .insert({
                email:loginEmail[0].email,
                name:name,
                joined:new Date()
            }).then(user=>{
                res.json(user[0])
            })

        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    
   .catch(err=>res.status(401).json('Unable to register'))
})

app.get('/profile/:id',(req,res)=>{
    const {id}=req.params;


    db.select('*').from('users').where({
        id:id
    }).then(user=>{
        if(user.length){
            res.json(user[0])
        }
        else{
            res.status(401).json('No user found')
        }
        
    })
    .catch(err=>res.status(401).json('No user found'))
})


// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });


app.listen(5000,()=>{
    console.log('app is running on port 5000')
});