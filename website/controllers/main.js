var myApp = angular.module('myApp');

myApp.controller('MainController', function($rootScope, $scope, $http, $location, $routeParams, UserService) {

	$scope.isLogin = function() {
		if (!UserService.isLogin()) {
			$location.path("/");
		} else {
			return true;
		}
	}

	$scope.createRepository = function() {
		var data = {
			name: $scope.repositoryName
		}
		$http({
			method: 'PUT',
			url: '/api/git/repository/create',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/repository");
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.deleteRepository = function(repository) {
		$http.delete('/api/git/repository/' + repository)
		.then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepositories();
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.getRepositories = function() {
		$scope.repositoryList = [];
		$http({
			method: 'GET',
			url: '/api/git/repository'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log(response.data.data);
					var repositories = response.data.data;
					for (var i in repositories) {
						$scope.repositoryList.push({
							name: repositories[i],
							collaboratorList: []
						});
						getCollaborators(i);
					}
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.getSshKeys = function() {
		$http({
			method: 'GET',
			url: '/api/user/'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				UserService.setUserData(response.data);
				$scope.sshKeyList = UserService.getSshKeys();
			} else {
				$location.path("/");
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

	$scope.redirectTo = function(path) {
		console.log(path);
		$location.path(path);
	}

	// Inner functions
	var getCollaborators = function(index) {
		var repository = $scope.repositoryList[index].name;
		$http({
			method: 'GET',
			url: '/api/git/repository/' + repository + '/collaborator'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log();
					$scope.repositoryList[index].collaboratorList = response.data.data;
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}
});