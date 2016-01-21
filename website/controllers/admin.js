var myApp = angular.module('myApp')

myApp.controller('AdminController', function($rootScope, $scope, $http, $location, $routeParams, $timeout, UserService, GitService) {
	const REPOSITORY_VIEW = 'repository'
	const USER_VIEW = 'user'

	const REPOSITORY_TAB = 'repository'
	const RELEASES_TAB = 'releases'
	const CONTRIBUTOR_TAB = 'controbutor'

	// Set default tab
	$scope.tab = REPOSITORY_TAB

	// Set subview
	if ($routeParams.subview) {
		$scope.subview = $routeParams.subview
	} else {
		$scope.subview = REPOSITORY_VIEW
	}

	// Set subview class
	$scope.repositoryClass = ''
	$scope.userClass = ''
	if ($scope.subview == REPOSITORY_VIEW) {
		$scope.repositoryClass = 'active'
	} else if ($scope.subview == USER_VIEW) {
		$scope.userClass = 'active'
	}

	// Set repository
	if ($routeParams.repository) {
		$scope.repository = $routeParams.repository
	}

	// Set user
	if ($routeParams.username) {
		$scope.username = $routeParams.username
	}

	$scope.isAdmin = function() {
		if (UserService.isAdmin()) {
			return true
		} else {
			$location.path("/")
		}
	}

	$scope.myUsername = function() {
		return UserService.getUsername()
	}

	$scope.getRepositories = function() {
		$scope.repositoryList = []
		$http({
			method: 'GET',
			url: '/api/admin/git/repository'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					var repositories = response.data.data
					for (var i in repositories) {
						$scope.repositoryList.push({
							name: repositories[i],
							data: {}
						})
						getRepository(i)
					}
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.getRepository = function() {
		console.log($routeParams.repository)
		console.log($routeParams.ref)
		console.log($routeParams.head)
		console.log($routeParams.branch)
		var repository = $routeParams.repository
		var currentBranch = ""
		var url = '/api/admin/git/repository/' + repository
		if ($routeParams.ref && $routeParams.head && $routeParams.branch) {
			currentBranch = $routeParams.ref + '/' + $routeParams.head + '/' + $routeParams.branch
			url = url + '/' + currentBranch
		}
		$http({
			method: 'GET',
			url: url
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					GitService.setGitData(repository, response.data.data)
					if (currentBranch.length > 0) {
						GitService.setCurrentBranch(currentBranch)
					}
					console.log('Set Owner: ' + GitService.getOwner())
					$scope.setOwner(GitService.getOwner())
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteRepository = function(repository) {
		$http.delete('/api/admin/git/repository/' + repository)
		.then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepositories()
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.changeOwner = function() {
		if ($scope.newOwner.length == 0) return

		var data = {
			username: $scope.newOwner
		}
		$http({
			method: 'PUT',
			url: '/api/admin/git/repository/' + $scope.repository + '/owner',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepository()
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.addCollaborator = function() {
		if (!$scope.newCollaborator || $scope.newCollaborator.length == 0) return

		var data = {
			username: $scope.newCollaborator
		}
		$http({
			method: 'PUT',
			url: '/api/admin/git/repository/' + $scope.repository + '/collaborator',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepository()
					$scope.errorMessage = 'username...'
					$scope.newCollaboratorClass = ''
				} else {
					$scope.errorMessage = response.data.result
					$scope.newCollaboratorClass = 'invalid-form'
				}
			}
			$scope.newCollaborator = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteCollaborator = function(collaborator) {
		$http({
			method: 'DELETE',
			url: '/api/admin/git/repository/' + $scope.repository + '/collaborator/' + collaborator
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepository()
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.getGitPath = function() {
		return GitService.getGitPath()
	}

	$scope.setOwner = function(newOwner) {
		$scope.newOwner = newOwner
	}

	$scope.getOwner = function() {
		return GitService.getOwner()
	}

	$scope.isEmptyRepository = function() {
		return GitService.isEmptyRepository()
	}

	$scope.getCurrentRepositoryName = function() {
		return GitService.getRepository()
	}

	$scope.getBranchs = function() {
		return GitService.getBranchs()
	}

	$scope.getCommits = function() {
		return GitService.getCommits()
	}

	$scope.getTags = function() {
		return GitService.getTags()
	}

	$scope.getCurrentBranch = function() {
		return GitService.getCurrentBranch()
	}

	$scope.getCommitNum = function() {
		return GitService.getCommitNum()
	}

	$scope.getBranchNum = function() {
		return GitService.getBranchNum()
	}

	$scope.getTagNum = function() {
		return GitService.getTagNum()
	}

	$scope.getCollaborator = function() {
		return GitService.getCollaborator()
	}

	$scope.getCollaboratorNum = function() {
		return GitService.getCollaboratorNum()
	}

	$scope.getUsers = function() {
		$scope.userList = []
		$http({
			method: 'GET',
			url: '/api/admin/user'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log(response.data.data)
					$scope.userList = response.data.data
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.addUser = function() {
		var data = {
			username: $scope.username,
			password: $scope.password
		}
		$http({
			method: 'PUT',
			url: '/api/admin/user/',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/admin/user")
				} else {
					$scope.errorMessage = response.data.result
					$scope.isNotMatch = true
					$scope.usernameClass = 'invalid-form'
					$scope.passwordClass = 'invalid-form'
					$scope.checkPasswordClass = 'invalid-form'
				}
			}

			$scope.username = ''
			$scope.password = ''
			$scope.checkPassword = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteUser = function(username) {
		$http({
			method: 'DELETE',
			url: '/api/admin/user/' + username
		}).then(function successCallback(response) {
			$scope.getUsers()
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.updatePassword = function() {
		var data = {
			password: $scope.newPassword
		}
		$http({
			method: 'POST',
			url: '/api/admin/user/' + $scope.username + '/change_password',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/admin/user")
				} else {
					$scope.errorMessage = response.data.result
					$scope.isNotMatch = true
					$scope.newPasswordClass = 'invalid-form'
					$scope.confirmPasswordClass = 'invalid-form'
				}
			}

			$scope.newPassword = ''
			$scope.confirmPassword = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.redirectTo = function(path) {
		console.log(path)
		$location.path(path)
	}

	$scope.isMyself = function(username) {
		if (username === UserService.getUsername()) {
			return true
		} else {
			return false
		}
	}

	$scope.isRepositoryView = function() {
		if ($scope.subview == REPOSITORY_VIEW) {
			return true
		} else {
			return false
		}
	}

	$scope.isUserView = function() {
		if ($scope.subview == USER_VIEW) {
			return true
		} else {
			return false
		}
	}

	$scope.isRepositoryTab = function() {
		if ($scope.tab == REPOSITORY_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.isReleasesTab = function() {
		if ($scope.tab == RELEASES_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.isContributorTab = function() {
		if ($scope.tab == CONTRIBUTOR_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.setTab = function(tab) {
		$scope.tab = tab
	}

	// Inner functions
	var getRepository = function(index) {
		var repository = $scope.repositoryList[index].name
		$http({
			method: 'GET',
			url: '/api/admin/git/repository/' + repository
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.repositoryList[index].data = response.data.data
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}
	
})