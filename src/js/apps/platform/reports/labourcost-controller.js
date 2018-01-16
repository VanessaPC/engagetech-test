"use strict";

/******************************************************************************************

Labour Cost Report controller

******************************************************************************************/

var app = angular.module("labourcost.controller", []);

app.controller(
	"ctrlLabourCost",
	["$rootScope", "$scope", "$timeout", "restalchemy", "navigation",

	function LabourCostCtrl(
		$rootScope,
		$scope,
		$timeout,
		$restalchemy,
		$navigation
	) {

		// Set the sorting function and the exception rules for it.
		$scope.propertyName = 'name';
		$scope.reverse = false;

		// Set the navigation tabs
		$navigation.select({
			forward: "reports",
			selected: "labourreport"
		});

		// Initialise the REST api
		var rest = $restalchemy.init({
			root: $rootScope.config.api.labourstats.root
		});

		rest.api = $rootScope.config.api.labourstats;

		rest.at(rest.api.costs).get().then(function (costdata) {
			var data = costdata[0];

			$scope.total = data.total[0];

			$scope.fullData = data.directContractors.concat(data.providers);

			$scope.sortBy($scope.propertyName);
		});

		// Calculate compliance score
		$scope.getComplianceScore = function (complianceStats) {
			if (!complianceStats) {
				return 0;
			}

			return Math.round(complianceStats.Total);
		};

		// Calculate the work force
		$scope.getWorkForce = function (workerCount) {
			if (!$scope.total) { return };

			return (workerCount / $scope.total.workerCount * 100).toFixed(1);
		};

		// Calculate the gross pay total
		$scope.getCurrency = function (grossPayTotal) {
			var formatter = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});

			return formatter.format(grossPayTotal / 100)
		};

		// Calculate the payroll total
		$scope.getPayroll = function (payrollTotal) {
			if (!payrollTotal) {
				return '-';
			}

			return payrollTotal;
		};

		$scope.sortBy = function (propertyName) {
			// flag the code to know if I should reverse or sort 
			$scope.reverse = (propertyName !== null && $scope.propertyName === propertyName)
				? !$scope.reverse : false;

			$scope.propertyName = propertyName;

			// sort the code
			$scope.fullData.sort(function (a, b) {
				var a1, b1;

				if (propertyName === 'workForce') {
					propertyName = 'workCount';
				}

				// Compliance stats is calculated and I want to sort with the raw value.
				if (propertyName === 'complianceStats') {
					a1 = a.complianceStats && a.complianceStats.Total || 0;
					b1 = b.complianceStats && b.complianceStats.Total || 0;
				} else {
					a1 = a[propertyName];
					b1 = b[propertyName];
				}

				// Set the rule for Direct Contractors always at the top
				if (propertyName === 'name') {
					if (a.name === 'Direct Contractors') {
						return -1;
					} else if (b.name === 'Direct Contractors') {
						return 1;
					}

					return a.name < b.name ? -1 : 1;
				}

				if (a1 < b1) {
					return -1;
				} else if (a1 > b1) {
					return 1;
				} else {
					return a.name < b.name ? -1 : 1;
				}

				return 0;
			});

			// reverse the code 
			if ($scope.reverse) {
				$scope.fullData.reverse();

				// Ensure that Direct Contractors will always remain at the top when I reverse
				if (propertyName === 'name') {
					$scope.fullData.unshift($scope.fullData.pop());
				}
			}
		};

	}]);
