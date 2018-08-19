// Make three separate controllers for the three separate layers of the application
// Data Layer controller: budgetController
// User Interface controller: UIController
// Global App controller: controller

// Since this is a small app, only one module containing these three controllers is sufficient

// BUDGET CONTROLLER
// Holds the data of the app
var budgetController = (function() {

    // Use function constrcutors to make objects of type Expense and Income
    // Function constructors form a schema or contract for Data Objects
    var Expense = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalInc) {
        if(totalInc > 0) {
            this.percentage = Math.round((this.value / totalInc) * 100);
        }
        else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var calculateTotal = function(type) {
        var sum = 0;
        
        data.allItems[type].forEach(function(cur){
            sum += cur.value;
        });

        data.totals[type] = sum;
    };

    // Data structure for holding all of the data of the app
    var data = {
        allItems: {
            inc: [],
            exp: []
        },
        totals: {
            inc: 0,
            exp: 0
        },
        budget: 0,
        percentage: -1
    };

    // Public functions
    return {
        // Function for adding new data item to the data object
        addItem: function(type, desc, val) {
            var newItem, ID;

            // Create new ID
            if(data.allItems[type].length > 0){
                // Get the id of the last element in the array and add 1 to it
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Create new Data Object based on whether it is Income or Expense
            if(type === 'inc'){
                newItem = new Income(ID, desc, val);
            }
            else if(type === 'exp'){
                newItem = new Expense(ID, desc, val);
            }

            // Push it into our data structure
            data.allItems[type].push(newItem);

            // Return newly created item
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.allItems[type].map(function(current){
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {

            // Calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');

            // Calculate budget as total income - total expense
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income we spent
            if(data.totals.inc > 0){
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            }
            else {
                data.percentage = -1;
            }

        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },

        getBudget() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        getPercentages() {

            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });

            return allPercentages;
        },

        testing: function() {
            console.log(data);
        }
    };
    
})();

// UI CONTROLLER
// Controller responsible for controlling all interaction with the User Interface
var UIController = (function() {

    // Object to hold references to all needed DOM Elements
    var DOMStrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(type, num) {
        var numSplit, int, dec, sign;

        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');

        int = numSplit[0];
        dec = numSplit[1];

        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }

        sign = type === 'exp' ? '-' : '+';

        return sign + ' ' + int + '.' + dec;
    };

    // A function which adds forEach functionality to a NodeList object
    var nodeListForEach = function (list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    // Public functions
    return {
        // Function to get input from user interface
        getInput: function() {
            return {
                type: document.querySelector(DOMStrings.inputType).value, // Will be either 'inc' or 'exp'
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            };
        },

        // Function to add item to user interface
        // Depending on whether it is of type Income or Expense
        addListItem: function(obj, type) {
            var html, newHtml, element;

            // Create HTML String with placeholder text
            if(type === 'inc'){
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description" >%description%</div ><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div >';
            }
            else if (type === 'exp'){
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description" >%description%</div ><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div >';
            }

            // Replace placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(type, obj.value));

            // Insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorID) {

            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },

        // Function to clear input fields
        clearFields: function() {
            var fields, fieldsArr;

            // Get all the fields to be cleared
            // GOTCHA: querySelectorAll returns list, not array
            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);

            // Convert list to array using slice method
            fieldsArr = Array.prototype.slice.call(fields);

            // Clear fields using forEach method
            fieldsArr.forEach(function(current){
                current.value = "";
            });

            // Set focus to first input field
            fieldsArr[0].focus();

        },

        displayBudget: function(budget) {
            var type;
            budget.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(type,budget.budget);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber('inc',budget.totalInc);
            document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber('exp',budget.totalExp);
            
            if(budget.percentage > 0){
                document.querySelector(DOMStrings.percentageLabel).textContent = budget.percentage + '%';
            }
            else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }

        },

        displayPercentages: function(percentages) {

            // Get all divs with class item__percentage
            // These are the html elements which contain the ercentage values
            var fields = document.querySelectorAll(DOMStrings.expPercLabel);

            // For each element with class '.item__percentage'
            // Set the textContent to be equal to the percentage at the same index in the percentages array
            nodeListForEach(fields, function(current, index) {

                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                }
                else {
                    current.textContent = '---';
                }
            });
        },

        displayMonth: function() {
            var now, month, year, months;

            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',' October', 'November', 'December'];

            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {
            var fields = document.querySelectorAll(
                DOMStrings.inputType + ',' +
                DOMStrings.inputDescription + ',' +
                DOMStrings.inputValue
            );

            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
        },

        // Function to get DOM references
        getDOMStrings: function() {
            return DOMStrings;
        }
    };
})();

// GLOBAL APP CONTROLLER
// Backbone of the app
// Manages communication between Data Layer(budgetController) and UI(UIController)
// Serves as the initialization point of the entire app
// Sets up event handlers
var controller = (function(bdgtCtrl, UICtrl){

    var updateBudget = function() {
        // 1. Calculate Budget
        bdgtCtrl.calculateBudget();

        // 2. Return Budget
        var budget = bdgtCtrl.getBudget();

        // 3. Display Budget to the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {

        // 1. Calculate Percentages
        bdgtCtrl.calculatePercentages();

        // 2. Get percentages
        var percs = bdgtCtrl.getPercentages();

        // 3. Display percentages on UI
        UICtrl.displayPercentages(percs);

    };

    // Function to receive data from UI, add it to bdgtCtrl, add it to UI
    // Calculate Budget and Display Budget
    // Main function of the app
    var ctrlAddItem = function() {
        // 1. Get input field value
        var input = UICtrl.getInput();

        // Validate inputs
        // Check if description is not empty, if value is a number and value is greater than zero
        if(input.description !== "" && !isNaN(input.value) && input.value > 0){
            // 2. Add the item to the budget controller
            var newItem = bdgtCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            UICtrl.clearFields();

            // 5. Update Budget
            updateBudget();

            // 6. Update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {
        var el = event.target;
        var itemID, splitID, type, id;

        // Alternate implementation to find correct parent without hardcoding DOM Traversal
        // var currentJumps = 0;
        // var ancestorCount = 4;

        // while(!el.classList.contains('item') && currentJumps < ancestorCount){
        //     el = el.parentNode;
        //     currentJumps++;
        // }

        el = el.parentNode.parentNode.parentNode.parentNode;

        itemID = el.id;
        if(itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);

            // 1. Delete item from data structure
            bdgtCtrl.deleteItem(type, id);

            // 2. Delete item from UI
            UICtrl.deleteListItem(itemID);

            // 3. Recalculate Budget
            updateBudget();

            // 4. Update percentages
            updatePercentages();
        }
    };

    // Function to setup event listeners
    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMStrings();
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13)
                ctrlAddItem();
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };
    
    // Public functions
    return {
        // Function to setup the entire app
        init: function() {
            console.log('Application has started.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0
            });
            setupEventListeners();
        }
    };
    
})(budgetController, UIController);

controller.init();
