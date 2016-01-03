var myApp = angular.module('myApp');

myApp.factory('UserService', function() {
	// View Define
	var USER_TYPE_BLOCK = -1;
	var USER_TYPE_NORMAL = 2;
	var USER_TYPE_ADMIN = 9;

	var userType = USER_TYPE_BLOCK;
	return {
		isLogin: function() {
			if (this.getUserType() > USER_TYPE_BLOCK) {
				return true;
			} else {
				return false;
			}
		},
		getUserType: function() {
			return userType;
		},
		setUserType: function(type) {
			userType = type;
		}
	};
});