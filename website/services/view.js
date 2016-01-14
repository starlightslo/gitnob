var myApp = angular.module('myApp')

myApp.factory('ViewService', function($rootScope) {
	// View Define
	var SIGNIN_PAGE = 1
	var SINGUP_PAGE = 2
	var REPOSITORY_PAGE = 3
	var SSH_KEY_PAGE = 4
	var SETTINGS_PAGE = 5
	var ADMIN_PAGE = 9

	var view = SIGNIN_PAGE
	return {
		subscribeViewChange: function(scope, callback) {
            var handler = $rootScope.$on('notifying-view-change-event', callback)
            scope.$on('$destroy', handler)
        },
		getView: function() {
			return view
		},
		setView: function(v) {
			view = v

			// Notify
			$rootScope.$emit('notifying-view-change-event')
		},
		isSignin: function() {
			if (view == SIGNIN_PAGE) return 'active'
			else return ''
		},
		isSignup: function() {
			if (view == SINGUP_PAGE) return 'active'
			else return ''
		},
		isRespository: function() {
			if (view == REPOSITORY_PAGE) return 'active'
			else return ''
		},
		isSshKey: function() {
			if (view == SSH_KEY_PAGE) return 'active'
			else return ''
		},
		isSettings: function() {
			if (view == SETTINGS_PAGE) return 'active'
			else return ''
		},
		isAdmin: function() {
			if (view == ADMIN_PAGE) return 'active'
			else return ''
		}
	}
})