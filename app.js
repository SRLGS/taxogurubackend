const express = require("express")
const mysql = require("mysql")
const bcrypt = require("bcrypt");
const nodemailer=require("nodemailer")
const app=express()
const jwt =require("jsonwebtoken")
let payload
app.use(express.json());
const db=mysql.createConnection({
  host:"localhost",
  user:"root",
  password:"root1234",
  database:"intuitaccount"
})

db.connect((err)=>{
    if(err){
        console.log(err)
    }else{
        console.log("connected")
    }
})

app.listen(1000, () => {
  console.log("listening on port 1000");
});



/*const createTableQuery = `
create table account
(
user_id VARCHAR(100) unique PRIMARY KEY,
    phone VARCHAR(100) UNIQUE,
    email VARCHAR(100) UNIQUE,
    passwordCreated VARCHAR(100),
    name VARCHAR(100));
  `;

  db.query(createTableQuery, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  });*/

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };
  const otpStore = {};
  app.post('/signup', async(req, res) => {
    const { user_id, name, email, password,phone } = req.body
    const query = 'SELECT * FROM account WHERE email = ?';
    db.query(query, [email], async(error, results) => {
      if (error) {
        console.error('Error Happened During Checking:', error);
        res.status(500).send('Error Happened During Checking');
      } else {
        if (results.length > 0) {
          res.status(200).send("User Already Exist");
        } else {
    const query = 'INSERT INTO account (user_id, passwordCreated, name, email, phone) VALUES (?, ?, ?, ?,?)';
    const newPassword= await bcrypt.hash(password,10)
    payload={user_id}
    db.query(query, [user_id, newPassword, name ,email, phone], (error, results) => {
        if (error) {
          console.error('Error Happened During Inserting Data', error);
          res.status(500).send('Error Happened During Inserting Data');
        } else {
         
          const otp = generateOTP();
          otpStore[email] = otp;  
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'ravitejasamboju@gmail.com',
              pass: 'tqoyywpwqmpydkhc',
            },
          });
          const mailOptions = {
            from: 'ravitejasamboju@gmail.com',
            to: `${email}`,
            subject: 'OTP for Verification',
            text: `Your OTP is: ${otp}`,
          };   
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error While Sending Mail', error);
              res.send("Error While Sending Mail");
            } else {
              console.log('Email sent:', info.response);
              res.send("Mail Sent");
            }      
          });
          res.status(200).send("Data Inserted Successfully");
        }
      });
          
        }
      }
    });
  });

  app.post('/verifyOTP', (req, res) => {
    const { email, otp } = req.body;
    const storedOTP = otpStore[email];
    if (storedOTP && storedOTP.toString() === otp) {
      delete otpStore[email];
      const jwtToken=jwt.sign(payload,"MY_SECRET_TOKEN")
      res.status(200).send(jwtToken);
    } else {
      res.status(500).send("otp Not Matched");
    }
  });   

  app.post('/signin', (req, res) => {
    const {email,password} = req.body;
    const query1 = 'SELECT * FROM account WHERE email = ?';
    const query2='select * from account where email=?'
    db.query(query1, [email], async(err, results1) => {
      if (err) {
        res.status(500).send( 'An error occurred For Email' );
        console.log("An Error Occured For Email")
      } else if (results1.length === 0) {
        res.status(500).send("User Not Exist" );
        console.log("User Not Exist")
      } else {
  
        const comparison= await bcrypt.compare(password,results1[0].passwordCreated)
        if(comparison){
        db.query(query2,[email],(err,results2)=>{
          if(err){
            res.status(500).send( 'An error occurred For Email and Password' );
            console.log("An Error Occured For Email and Password")
          }
          else{
            console.log(results2)
            const payload={user_id:results2[0].user_id}
            const jwtToken= jwt.sign(payload,"MY_SECRET_TOKEN")
            res.status(200).json({jwt_token: jwtToken });
            console.log("Signin Successful")
          }
        })
      }else{
        res.status(500).send("Password is Incorrect")
      }
      }
    });
  });


  app.post("/admin", (req, res) => {
    const { username, password } = req.body;
    if (username === "taxoguru" && password === "taxoguru123") {
        const query = 'SELECT * FROM account';
        db.query(query, (err, results) => {
            if (err) {
                res.status(500).json({ message: 'An error occurred' });
                console.log("An Error Occurred");
            } else {
                res.status(200).send({ results });
            }
        });
    } else {
        res.status(500).send("Invalid Admin");
    }
});

//CHANGE PASSWORD 
      const forgotPassword={}

      app.put('/forgotPassword', async (req, res) => {
      try {
        const { email } = req.body;
        const rows = await db.query('SELECT * FROM account WHERE email = ?', email);
        if (rows.length === 0) {
          return res.status(404).send('User not found' );
        }
        const otp = generateOTP();
        forgotPassword[email] = otp;  
    
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'ravitejasamboju@gmail.com',
            pass: 'tqoyywpwqmpydkhc',
          },
        });
        const mailOptions = {
          from: 'ravitejasamboju@gmail.com',
          to: `${email}`,
          subject: 'OTP For Resetting Password',
          text: `Your Otp For Resetting Password is: ${otp}`,
        };   
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error While Sending Mail', error);
            res.send("Error While Sending Mail");
          } else {
            console.log('Email sent:', info.response);
            res.send("Mail Sent");
          }      
        });
        res.send('Password reset link sent successfully' );
      } catch (error) {
        res.status(500).send('Failed to send password reset email');
      }
    });
        
    app.post('/forgotPasswordOtp', async (req, res) => {
        const { password ,email,otp} = req.body; 
        const query='update account set passwordCreated=? where email=?'
        console.log(forgotPassword)  
        const storedOTP =  forgotPassword[email];
        if (storedOTP && storedOTP.toString() === otp) {
          const hashedPassword = await bcrypt.hash(password, 10);
          db.query(query,[hashedPassword,email],(err,result)=>{
            if(err){
              res.status(500).send("error Happend During Request")
            }else{
              res.status(200).send('Password reset successful' );
            }
          })
          delete forgotPassword[email];
          console.log(forgotPassword)
        } else {
          res.status(500).send("otp Not Matched");
        }
    });

    app.get('/adminDetails', (req, res) => {
      const query = 'SELECT * FROM account';
      db.query(query, (err, data) => {
        console.log(err,data)
        if (err) {
          console.log('Error In Fetching Data From Database:', err);
          res.status(500).send("Error In Fetching Data From Database");
        } else {
          res.status(200).json({data});
        }
      });                                           
    });
    

    app.get('/adminEmail', (req, res) => {
      const{email}=req.body
      const query = 'SELECT * FROM account where email=?';
      db.query(query, [email], (err, data) => {
        console.log(err,data)
        if (err) {
          console.log('Error In Fetching Data From Database:', err);
          res.status(500).send("Error In Fetching Data From Database");
        } else {
          res.status(200).json({data});
        }
      });                                           
    });
    
    
    /*const createTableQuery1 = `
    create table  SpouseDetails
    (id int auto_increment primary key,
    user_id varchar(100) ,
    SpouseLastName varchar(100),
    SpouseFirstName varchar(100) ,
    SpouseMiddleName varchar(100),
    DOB varchar(100) ,
    SSN varchar(100) ,
   CountryOfCitizenship varchar(100),
   visaCategory varchar(100) ,
   Occupation varchar(100) ,
   FirstDateOfEntryToUS varchar(100) ,
   Foreign key(user_id) references account(user_id) on delete cascade
)`;*/


/*db.query(createTableQuery1, (error, results, fields) => {
  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Table created successfully');
  }
  db.end(); 
})*/

  


/*const createTableQuery2 = `CREATE TABLE taxpayer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id  unique VARCHAR(100) ,
  LastName VARCHAR(100) default null,
  FirstName VARCHAR(100)default null,
  MiddleName VARCHAR(100)default null,
  MaritalStatus VARCHAR(100)default null,
  DOM VARCHAR(100)default null,
  DOB VARCHAR(100)default null,
  SSN VARCHAR(100)default null,
  Country VARCHAR(100)default null,
  VisaCategory VARCHAR(100)default null,
  Occupation VARCHAR(100)default null,
  FirstDateOfEntryToUS VARCHAR(100) default null,
  DidyoueverchangedyourvisacategoryduringTY2022 VARCHAR(100) default null,
  EmailID VARCHAR(100) default null,
  PrimaryContactNumber VARCHAR(100) default null,
  AlternateContactNumber VARCHAR(100) default null,
  CurrentStreetaddress VARCHAR(100) default null,
  AptNumber VARCHAR(100) default null,
  City VARCHAR(100) default null,
  State VARCHAR(100) default null,
  ZipCode VARCHAR(100) default null,
  HealthInsurance VARCHAR(100) default null,
  FullYearOrPartYear VARCHAR(100) default null,
  EmployerOrMarketPlace VARCHAR(100) default null,
  MedicalexpensesYesorNo VARCHAR(100) default null,
  medialexpensesusingHSAAccountYesorNo VARCHAR(100) default null,
  RealestatepropertytaxesinUSYesorNo VARCHAR(100) default null,
  HomeMortgageInterestUSorForeignCountryYesorNo VARCHAR(100) default null,
  CharitableContributionsin2022YesorNo VARCHAR(100) default null,
  HaveyoupaidanypersonalpropertyMotorvehicletaxes VARCHAR(100) default null,
  Nameoftaxtownordistrictforwhichvehicletaxesarepaid VARCHAR(100) default null,
  HowdidyoufiledyourlastyeartaxreturnsItemizedOrStandard VARCHAR(100) default null,
  EducationexpensesforyourselfyourSpouseorDependants VARCHAR(100) default null,
  HaveyoupaidanyStudentLoanInterestinUSA VARCHAR(100) default null,
  HaveyousoldanystocksCapitalAssetsinUSorForeignCountry VARCHAR(100) default null,
  HaveyouearnedanyInterestIncomeinUSorForeignCountry VARCHAR(100) default null,
  DoyouhaveanydividendIncomeinUSorForeignCountry VARCHAR(100) default null,
  DoyouhaveanyRentalorBusinessIncomeexpensesinUSorForeignCountry VARCHAR(100) default null,
  DoyouhaveanyDistributionsfromIRAPensionAccountorHSAAccount VARCHAR(100) default null,
  HaveyoumadeanyIRAcontributionsorplanningtodoforTY2022 VARCHAR(100) default null,
  CollagesavingsplanforyourdependentsYesorNo VARCHAR(100) default null,
  DateOFRental VARCHAR(100) default null,
  AddressOfTheProperty VARCHAR(100) default null,
  CityOfProperty VARCHAR(100) default null,
  StateOfProperty VARCHAR(100) default null,
  CountryOfProperty VARCHAR(100) default null,
  MaterialParticipation VARCHAR(100) default null,
  TimeSpentInBusinessDuringTheYear VARCHAR(100) default null,
  PropertyPurchaseDATE VARCHAR(100) default null,
  PropertyPurchasePRICE INT default null,
  ValueOfcapitalImprovements INT default null,
  ValueOfLand INT default null,
  TotalRentReceivedDuringTaxYear INT default null,
  Advertising INT default null,
  CleaningMaintenance INT default null,
  Commissions INT default null,
  Insurance INT default null,
  Interest INT default null,
  LegalFees INT default null,
  LocalTransportationExpenses INT default null,
  PointsPaidOnLoan INT default null,
  RentalPaymentsLoss INT default null,
  Repairs INT default null,  
  TaxReturnPreparationFees INT default null,
  Taxes INT default null,
  TravelExpenses INT default null,
  Utilities INT default null,
  OtherExpenses INT default null,
  MortgageInsurance INT default null,
  Depreciation INT default null,
  FOREIGN KEY (user_id) REFERENCES account(user_id) ON DELETE CASCADE
);`



db.query(createTableQuery2, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })


const createTableQuery3 = `create table  DependentDetails
(id int auto_increment primary key,
user_id varchar(100) ,
DoYouHaveAnyDependantsInUSA VARCHAR(100),
DependantFirstName varchar(100),
DependantMiddleName varchar(100),
DependantLastName varchar(100),
CountryOfCitizenship varchar(100),
DependantVisaCategory varchar(100),
DependantDateOfBirth varchar(100),
SSN varchar(100),
Relationship varchar(100),
FirstDateOfEntryToUS varchar(100),
DayCareExpensesIfBothTaxpayerAndSpouseAreWorking varchar(100),
Foreign key(user_id) references account(user_id) on delete cascade
)
`

db.query(createTableQuery3, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })

const createTableQuery4 = `create table EmploymentDetailsTaxpayer
(id int auto_increment primary key,
user_id varchar(100) ,
EMPLOYERNAME varchar(100),
EmploymentStartDate varchar(100),
EmploymentEndDate varchar(100),
Foreign key(user_id) references account(user_id) on delete cascade)
`

db.query(createTableQuery4, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })

const createTableQuery5 = `create table EmploymentDetailsSpouse
(id int auto_increment primary key,
user_id varchar(100) ,
EMPLOYERNAME varchar(100),
EmploymentStartDate varchar(100),
EmploymentEndDate varchar(100),
Foreign key(user_id) references account(user_id) on delete cascade)`


db.query(createTableQuery5, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })




const createTableQuery6 = `create table ResidencyDetailsTaxpayer
(id int auto_increment primary key,
user_id varchar(100),
ResidencyStateAndCityName VARCHAR(100),
StartDate VARCHAR(100),
EndDate VARCHAR(100),
TotalRentPaidDuring VARCHAR(100),
Foreign key(user_id) references account(user_id) on delete cascade)`

db.query(createTableQuery6, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })


const createTableQuery7 = `create table ResidencyDetailsSpouse
(id int auto_increment primary key,
user_id varchar(100),
ResidencyStateAndCityName VARCHAR(100),
StartDate VARCHAR(100),
EndDate VARCHAR(100),
TotalRentPaidDuring VARCHAR(100),
Foreign key(user_id) references account(user_id) on delete cascade)`


db.query(createTableQuery7, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })


const createTableQuery8 = `create table FABRInformation
(id int auto_increment primary key,
user_id varchar(100),
MaximumValueOfAccountDuringCalendarYearReported varchar(100),
TypeOfAccount varchar(100),
NameOfTheFinancialInstitutionInWhichAccountIsHeld varchar(100),
MailingAddressOfBank varchar(100) ,
Foreign key(user_id) references account(user_id) on delete cascade)`


db.query(createTableQuery8, (error, results, fields) => {
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('Table created successfully');
    }
    db.end(); 
  })*/




app.post('/spouseDetails', async(req,res)=>{
  try{
      const{
          user_id,
          SpouseLastName,
          SpouseFirstName,
          SpouseMiddleName,
          DOB,
          SSN,
         CountryOfCitizenship,
         visaCategory,
         Occupation,
         FirstDateOfEntryToUS
      }=req.body;

      const insertQuery=`INSERT INTO spouseDetails (user_id,SpouseLastName, 
          SpouseFirstName,
          SpouseMiddleName,
          DOB,
          SSN,
         CountryOfCitizenship,
         visaCategory,
         Occupation,
         FirstDateOfEntryToUS) VALUES(?,?,?,?,?,?,?,?,?,?)` 

      const insertValues=[
          user_id,SpouseLastName,
          SpouseFirstName,
          SpouseMiddleName,
          DOB,
          SSN,
         CountryOfCitizenship,
         visaCategory,
         Occupation,
         FirstDateOfEntryToUS
      ]; 


      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          console.log(err)
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      })
  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})






app.post('/DependentDetails', async(req,res)=>{
  try{
      const{
          user_id,
          DoYouHaveAnyDependantsInUSA,
          DependantFirstName,
          DependantMiddleName,
          DependantLastName,
          CountryOfCitizenship,
          DependantVisaCategory,
          DependantDateOfBirth,
          SSN,
          Relationship,
          FirstDateOfEntryToUS,
          DayCareExpensesIfBothTaxpayerAndSpouseAreWorking}=req.body;

  const insertQuery=`INSERT INTO DependentDetails(user_id,
      DoYouHaveAnyDependantsInUSA,
      DependantFirstName,
      DependantMiddleName,
      DependantLastName,
      CountryOfCitizenship,
      DependantVisaCategory,
      DependantDateOfBirth,
      SSN,
      Relationship,
      FirstDateOfEntryToUS,
      DayCareExpensesIfBothTaxpayerAndSpouseAreWorking) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)` 
      
      const insertValues=[
          user_id,
          DoYouHaveAnyDependantsInUSA,
          DependantFirstName,
          DependantMiddleName,
          DependantLastName,
          CountryOfCitizenship,
          DependantVisaCategory,
          DependantDateOfBirth,
          SSN,
          Relationship,
          FirstDateOfEntryToUS,
          DayCareExpensesIfBothTaxpayerAndSpouseAreWorking
      ];


      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      })

  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})





app.post('/EmploymentDetailsTaxpayer',async(req,res)=>{
  try{
      const{
          user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate  
      }=req.body
      
      const insertQuery=`INSERT INTO EmploymentDetailsTaxpayer(user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate ) VALUES(?,?,?,?)`
      
      const insertValues=[
          user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate 
      ];
      
      
      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      })
    
  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})




app.post('/EmploymentDetailsTaxpayerSpouse',async(req,res)=>{
  try{
      const{
          user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate  
      }=req.body
      
      const insertQuery=`INSERT INTO EmploymentDetailsSpouse(user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate ) VALUES(?,?,?,?)`
      
      const insertValues=[
          user_id,
          EMPLOYERNAME, 
          EmploymentStartDate, 
          EmploymentEndDate 
      ];    
     

      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      })
  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})   



app.post('/ResidencyDetailsTaxpayer',async(req,res)=>{
  try{

    const {
      user_id,
      ResidencyStateAndCityName,
      StartDate,
      EndDate,
      TotalRentPaidDuring
  } = req.body;

  const insertQuery = `INSERT INTO ResidencyDetailsTaxpayer(user_id,
      ResidencyStateAndCityName,
      StartDate,
      EndDate,
      TotalRentPaidDuring) VALUES (?, ?, ?, ?, ?)`;

  const insertValues = [
      user_id,
      ResidencyStateAndCityName,
      StartDate,
      EndDate,
      TotalRentPaidDuring
  ];
  db.query(insertQuery,insertValues,(err,result)=>{
    if(err){
      res.status(500).send("error Happend During Sending")
    }else{
      res.status(200).send('Data Inserted Successfully' );
    }
  })
     
    }
    catch(err){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  })




app.post('/ResidencyDetailsSpouse', async (req, res) => {
  try {
      const {
          user_id,
          ResidencyStateAndCityName,
          StartDate,
          EndDate,
          TotalRentPaidDuring
      } = req.body;

      const insertQuery = `INSERT INTO ResidencyDetailsSpouse(user_id,
          ResidencyStateAndCityName,
          StartDate,
          EndDate,
          TotalRentPaidDuring) VALUES (?, ?, ?, ?, ?)`;

      const insertValues = [
          user_id,
          ResidencyStateAndCityName,
          StartDate,
          EndDate,
          TotalRentPaidDuring
      ];
      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      })      
  } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});




app.post('/FABRInformation',(req,res)=>{
  try{
      const {
        user_id,
        MaximumValueOfAccountDuringCalendarYearReported,
        TypeOfAccount,
        NameOfTheFinancialInstitutionInWhichAccountIsHeld,
        MailingAddressOfBank  
      }=req.body;

      const insertQuery =`INSERT INTO FABRInformation(user_id,
      MaximumValueOfAccountDuringCalendarYearReported,
      TypeOfAccount,
      NameOfTheFinancialInstitutionInWhichAccountIsHeld,
      MailingAddressOfBank 
       ) VALUES(?,?,?,?,?)`

      const insertValues = [
        user_id,
        MaximumValueOfAccountDuringCalendarYearReported,
        TypeOfAccount,
        NameOfTheFinancialInstitutionInWhichAccountIsHeld,
        MailingAddressOfBank 
      ];  
      
      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      }) 

  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})




const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.userId = payload.userId;
        next();
      }
});
}
};


app.post("/personalInformation", (req,res)=>{
  try{
      const {
  user_id   ,
  LastName ,
  FirstName ,
  MiddleName ,
  MaritalStatus ,
  DOM ,
  DOB ,
  SSN ,
  Country ,
  VisaCategory ,
  Occupation,
  FirstDateOfEntryToUS,
  DidyoueverchangedyourvisacategoryduringTY2022
      }=req.body;

      const insertQuery =`INSERT INTO taxpayer(
        user_id   ,
        LastName ,
        FirstName ,
        MiddleName ,
        MaritalStatus ,
        DOM ,
        DOB ,
        SSN ,
        Country ,
        VisaCategory ,
        Occupation,
        FirstDateOfEntryToUS,
        DidyoueverchangedyourvisacategoryduringTY2022
       ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`

      const insertValues = [
        user_id   ,
        LastName ,
        FirstName ,
        MiddleName ,
        MaritalStatus ,
        DOM ,
        DOB ,
        SSN ,
        Country ,
        VisaCategory ,
        Occupation,
        FirstDateOfEntryToUS,
        DidyoueverchangedyourvisacategoryduringTY2022
      ];  
      
      db.query(insertQuery,insertValues,(err,result)=>{
        if(err){
          console.log(err)
          res.status(500).send("error Happend During Sending")
        }else{
          res.status(200).send('Data Inserted Successfully' );
        }
      }) 

  }catch(error){
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
})


