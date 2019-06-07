var express = require("express"),
	mongoose = require("mongoose"),
	bodyParser = require("body-parser");
	app = express();
var currentUser = "";

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost/barc");

var userSchema = new mongoose.Schema({
	email : {
		type : String,
		unique : true,
		required : true,
		trim : true
	},
	username : {
		type : String,
		unique : true,
		required : true,
		trim : true
	},
	password : {
		type : String,
		required : true,
		trim : true
	},
	passwordConf : {
		type : String,
		required : true
	}
});

var transactionschema = new mongoose.Schema({
	username : {
		type : String,
		unique : true,
		required : true,
		trim : true
	},
	time : {
		type : Date, 
		default : Date.now,
		required : true
	},
	narration : {
		type : String,
		required : true,
		trim : true
	},
	debit : {
		type : Number,
		default : 0
	},
	credit : {
		type : Number,
		default : 0
	}
});

accountschema = new mongoose.Schema({
	username : {
		type : String,
		unique : true,
		required : true,
		trim : true
	},
	bank : {
		type : String,
		required : true,
		trim : true
	},
	bankid : {
		type : String,
		unique : true,
		required : true,
	},
	password  : {
		type : String,
		required : true
	},
	amount : {
		type : Number,
		default : 5000,
		required : true
	}
});

var accounts = mongoose.model("account", accountschema);
var transact = mongoose.model("transaction", transactionschema);
var database = mongoose.model("database", userSchema);
module.exports = "database";

app.get("/", function(req, res) {
	res.render("index");
});

app.get("/login", function(req, res) {
	res.render("login");
});

app.post("/login", function(req, res) {
	var usrname = req.body.uname;
	var pass = req.body.psw;
	database.findOne({"username" :usrname,"password":pass},function(err, list) {
		if(err)
			console.log(err);
		else {
			if(list != null){
				currentUser = usrname;
				res.redirect("/home");
			}
			else
			{
				res.render("login");
			}
		}
	});
});

app.get("/register", function(req, res) {
	res.render("register")
});

app.post("/register", function(req, res) {
	var details = {
		email : req.body.email,
		username : req.body.username,
		password : req.body.password,
		passwordConf : req.body.passwordConf
	}

	database.create(details, function(err, user) {
		if(err)
			console.log(err);
		else
			res.render("main");
	});
	currentUser = req.body.username
});

app.get("/home", function(req, res) {
	res.render("main");
});

app.get("/home/addAccount", function(req, res) {
	res.render("add");
});

app.post("/home/addAccount", function(req, res) {
	console.log("asdf");
	var details = {
		bank : req.body.bank1,
		username : req.body.username1,
		bankid : req.body.bid1,
		password : req.body.bpass1
	}

	accounts.create(details, function(err, user) {
		if(err)
			console.log(err);
		else
			res.redirect("/home");
	});
})

app.get("/home/show/transactions", function(req, res) {
	transact.find({"username": currentUser}, function(err, alltransactions) {
		if(err)
			console.log(err);
		else
			res.render("display", {transactions : alltransactions})
	})
});

app.get("/home/transfer", function(req, res) {
	res.render("transfer");
})

app.post("/home/transfer", function(req, res) {
	var rcv = req.body.rcv;
	var amt = req.body.amount;
	console.log(amt);
	console.log(rcv);
	accounts.findOne({"username" : rcv}, function(err, list) {
		if(err)
			console.log(err);
		else {
			if(list != null){

				accounts.findOne({"username" : currentUser}, function(err, user) {
					if(err)
						console.log(err);
					else {
						if(user.amount < amt) {
							//res.render("erroramt");
						}
						else {
							console.log(rcv);
							var newamount = user.amount - amt;
							accounts.update({username : user.username}, {$set: {amount: newamount}}, function() {
								var namount = Number(list.amount) + Number(amt);
								accounts.update({username : list.username}, {$set: {amount: namount}}, function() {
									var newtransaction = {
										username : currentUser,
										time : new Date(),
										narration : "money transferred from " + currentUser + " to " + list.username,
										debit : amt,
										credit : 0
									}
									console.log("hey")
									transact.create(newtransaction, function(err, t) {
										var ntransaction = {
											username : list.username,
											time : new Date(),
											narration : "money transferred from " + currentUser + " to " + list.username,
											debit : 0,
											credit : amt
										}
										console.log("hh")
										transact.create(ntransaction, function(err, t) {
										res.redirect("/home");
										});
									});
								});
							});
							
						}
					}
				});
			}
			else {
				//user does not exist
				//res.render("errorexist");
			}
		}
	});

});

app.get("/home/Tnc", function(req, res) {
	res.render("TnC");
});

app.get("/home/About", function(req, res) {
	res.render("About");
});

app.listen(3000, function() {
	console.log("Server is up and running!!!");
});