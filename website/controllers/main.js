var myApp = angular.module('myApp');

myApp.controller('MainController', function($rootScope, $scope, $http, $location, $routeParams, UserService) {

	$scope.isLogin = function() {
		return UserService.isLogin();
	}

	$scope.getRepositories = function() {
		$http({
			method: 'GET',
			url: '/api/git/repository'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log(response.data.data);
					$scope.repositoryList = response.data.data;
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.login = function() {
		var data = {
			username: $scope.username,
			password: $scope.password,
		}
		console.log(data);
		$http({
			method: 'POST',
			url: '/api/user/signin',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data);
					$location.path("/repository");
				}
			}

			$scope.username = '';
			$scope.password = '';
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

});