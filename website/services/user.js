var myApp = angular.module('myApp');

myApp.factory('UserService', function($rootScope, $http) {
	// View Define
	var USER_TYPE_BLOCK = -1;
	var USER_TYPE_NORMAL = 2;
	var USER_TYPE_ADMIN = 9;

	var userData = {
		type: USER_TYPE_BLOCK
	};
	return {
		subscribeUserChange: function(scope, callback) {
			var handler = $rootScope.$on('notifying-user-change-event', callback);
			scope.$on('$destroy', handler);
		},
		setUserData: function(data) {
			userData = data;

			// Notify
			$rootScope.$emit('notifying-user-change-event');
		},
		isLogin: function() {
			if (this.getUserType() > USER_TYPE_BLOCK) {
				return true;
			} else {
				return false;
			}
		},
		getUserType: function() {
			return userData.type;
		},
		getUsername: function() {
			return userData.username;
		},
		getSshKeys: function() {
			return userData.sshKeyList;
		},
		getUser: function() {
			var setUserData = this.setUserData;
			$http({
				method: 'GET',
				url: '/api/user/'
			}).then(function successCallback(response) {
				console.log(response);
				if (response.status == 200) {
					setUserData(response.data);
				}
			}, function errorCallback(error) {
				console.log(error);
			});
		},
		clearUser: function() {
			this.setUserData({
				type: USER_TYPE_BLOCK
			});
		}
	};
});