var express = require('express'); 
var path = require('path'); 
var app = express(); 
var paypal = require('paypal-rest-sdk');


paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': 'AetqMUApKjiGgwfdrG3jjOgIO3qEi7k44seRwj_OepDxJmh7wBYwzovh7xMKyt1ihSxFnntFMrKWeAse',
  'client_secret': 'EHpt67LBZboiQBZJhWs2lKj9qHbzdNMKSw-oOmyKoa-3edLU8Rch-tGbpBJIUBRPxyJY_fIkSY-0NM14'
});

// set public directory to serve static files 
app.use('/', express.static(path.join(__dirname, 'public'))); 


// redirect to store 
app.get('/' , (req , res) => {
    res.redirect('/index.html'); 
})

// start payment process 
app.get('/buy' , ( req , res ) => {
    var payment = {
    "intent": "sale",
	"payer": {
		"payment_method": "paypal"
	},
	"redirect_urls": {
		"return_url": "https://paypal-testappckh.herokuapp.com/success",
		"cancel_url": "https://paypal-testappckh.herokuapp.com/err"
	},
	"transactions": [{
		"amount": {
			"total": 39.00,
			"currency": "USD"
		},
		"description": " a book on mean stack "
	}]
    }
    createPay( payment ) 
        .then( ( transaction ) => {
            console.dir(transaction);
            var id = transaction.id; 
            var links = transaction.links;
            var counter = links.length; 
            while( counter -- ) {
                if ( links[counter].method == 'REDIRECT') {
                    return res.redirect( links[counter].href )
                }
            }
        })
        .catch( ( err ) => { 
            console.log( err ); 
            res.redirect('/err');
        });
}); 


app.get('/success' , (req ,res ) => {
    console.log(req.query);     

    var paymentId = req.query.paymentId;
    var payerId = { payer_id: req.query.PayerID };

    paypal.payment.execute(paymentId, payerId, function(error, payment){
      if(error){
        console.error(JSON.stringify(error));
      } else {
        if (payment.state == 'approved'){
          console.log('payment completed successfully');
          res.redirect('/success.html'); 
        } else {
          console.log('payment not successful');
        }
      }
    });

})

app.get('/err' , (req , res) => {
    console.log(req.query); 
    res.redirect('/err.html'); 
})

app.listen( process.env.PORT || 3000 , () => {
    console.log(' app listening on ' + process.env.PORT || 3000); 
})



// helper functions 
var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}