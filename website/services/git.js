var myApp = angular.module('myApp');

myApp.factory('GitService', function($rootScope, $http) {
	var repositoryName = "";
	var currentBranch = "";
	var gitData = {
		defaultBranch: "",
		branchList: [],
		tagList: [],
		commitList: []
	};
	return {
		getRepository: function() {
			return repositoryName;
		},
		setGitData: function(name, data) {
			repositoryName = name;
			gitData = data;
			currentBranch = gitData.defaultBranch;
		},
		setCurrentBranch: function(branch) {
			currentBranch = branch;
		},
		getDefaultBranch: function() {
			return gitData.defaultBranch;
		},
		getBranchs: function() {
			return gitData.branchList;
		},
		getTags: function() {
			return gitData.tagList;
		},
		getCommits: function() {
			return gitData.commitList;
		},
		getCurrentBranch: function() {
			return currentBranch;
		},
		isEmptyRepository: function() {
			if (gitData.defaultBranch.length == 0) {
				return true;
			} else {
				return false;
			}
		}
	};
});