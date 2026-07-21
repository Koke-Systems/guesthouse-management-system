var express        = require('express');
var mustache       = require('mustache');
var moment         = require('moment');
var router         = express.Router();

var ParamLib       = require('../../../lib/classParam');
var HtmlLib	       = require('../../../lib/classHtml');
var UserLib        = require('../../../lib/classUser');
var LogLib	       = require('../../../lib/classLogging');
var PackStnLib     = require('../../../lib/classPackingStn');

var param          = new ParamLib();
var html           = new HtmlLib();
var user           = new UserLib();
var log            = new LogLib();
var packstn        = new PackStnLib();

function SetSession(req, UserData, callback){
	req.session.userid = UserData.FirstName;
	req.session.surname = UserData.LastName;
	req.session.username = UserData.UserID;

	let UserPriv = [];
	let UserGroup = UserData.UserGroup;


	param.Find({"ParameterName" : "UserGroupSettings", "Fields.GroupName":{$in: UserGroup}}, function(Resp){
		if(Resp.Err){
		}

		if(Resp.Params){
			let x = 0;
			let Params = Resp.Params;
			while(x < Params.length){
				let GroupFunctions = Params[x].Fields.GroupFunctions;
				let y = 0;
				while(y < GroupFunctions.length){
					if(UserPriv.indexOf(GroupFunctions[y]) < 0){
						UserPriv.push(GroupFunctions[y]);
					}
					y++;
				}
				x++;
			}
		}

		req.session.UserPriv = UserPriv;
		req.session.UserGroup = UserData.UserGroup;
		//console.log(req.session.UserPriv);

		UserData.LastLogin = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
		user.Update(UserData, function(Resp){
			return callback(Resp.SavedDoc);
		});
	});
} /* SetSession */

function SendResponse(extPage, Data, res){
	let frame = {}
	let page = html.GetPage(null);

	if(!extPage){
		frame.ext = html.GetPage('login');
	} else {
		frame.ext = html.GetPage(extPage);
	}

	let htmlpage = mustache.render(page, Data, frame);
	res.send(htmlpage);
} /* SendResponse */

function DetermineRedirectOnLogon(req, res){
	let StnIP = html.GetIpAddress(req);

	packstn.FindOne({'IpAddress': StnIP}, function(Resp){
		if(Resp.Rec){
			return html.WEB_CallPageRedirect(res, '/API/packingstn');
		}

		return html.WEB_CallPageRedirect(res, '/API/dashboard');
	});
} /* DetermineRedirectOnLogon */

router.get('/API/login/', function (req, res) {
	let frame = {}
	frame.ext = null;

	let Data = html.GetLoginPage({}, null);

	if(req.session.msg){
		Data.alertMsg = req.session.msg;
		delete req.session.msg;
	}

	let page = html.GetPage('login');
	let htmlpage = mustache.render(page, Data, frame);

	res.send(htmlpage);
});

router.get('/API/ValidatePwd/', function (req, res) {
	let frame = {}
	frame.ext = null;

	let Data = html.GetLoginPage({}, null);

	if(req.session.msg){
		Data.alertMsg = req.session.msg;
		delete req.session.msg;
	}

	Data.Username = req.session.userid.Username;

	let page = html.GetPage('ValidatePwd');
	let htmlpage = mustache.render(page, Data, frame);

	res.send(htmlpage);
});

router.post('/API/ValidatePwd/', function (req, res) {
	user.CompareLoginDetails(req,function(Resp){
		if(!Resp){
			req.session.msg = Resp.Err;
			return html.WEB_CallPageRedirect(res, '/API/ValidatePwd/');
		}

		if(!Resp.Username){
			req.session.msg = Resp.Err;
			return html.WEB_CallPageRedirect(res, '/API/ValidatePwd/');
		}

		let PasswordUpdate = Resp.Password;
		let UserUpdate    = Resp.Username;

		user.FindOneRec({'UserID':Resp.Username.toLowerCase()}, function(Resp){

			let User = Resp.Rec;
			User.ConfirmedPassword = true;
			User.Password = PasswordUpdate
		 	user.UpdateUser(User,function(){

			log.WriteUserTrToDB(param, 'ManageUsers', UserUpdate, 'User Password Updated' + UserUpdate);
				SetSession(req, User, function(Resp){
					return html.WEB_CallPageRedirect(res, '/API/dashboard');
				});
			});
		});
	});
});

router.post('/API/logon/', function (req, res) {
	let Data;

	user.GetLoginDetails(req, function(Resp){

		if(!Resp){
			req.session.msg = 'Failed to authenticate user';
			return html.WEB_CallPageRedirect(res, '/API/login/');
		}

		let eUser = Resp;

		 user.FindOne(Resp.Username.toLowerCase(), Resp.Password, true, function(Resp){

			if(Resp.Err){
				req.session.msg = 'Failed to authenticate user';
				return html.WEB_CallPageRedirect(res, '/API/login/');
			}

			if(!Resp.User){
				req.session.msg = 'Failed to authenticate user';
				return html.WEB_CallPageRedirect(res,user, '/API/login/');
			}

			if(Resp.Batch){
				req.session.msg = 'Failed to authenticate user';
				return html.WEB_CallPageRedirect(res, '/API/login/');
			}

			if(!Resp.User.ConfirmedPassword){
				req.session.userid = eUser;
				return html.WEB_CallPageRedirect(res, '/API/ValidatePwd/');
			}

			SetSession(req, Resp.User, function(Resp){
				return DetermineRedirectOnLogon(req, res);
			});
		});
	});
});

router.get('/API/logout', html.requireLogin, function (req, res) {
	let loggedInUser = req.session.username;

	delete req.session.userid;
	delete req.session.surname;
	delete req.session.username;

	return html.WEB_CallPageRedirect(res, '/API/')
});

module.exports = router;