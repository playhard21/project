$(document).ready(function () {

//loading data from backend    
    var backend = function () {
        var jsonTemp = null;
        $.ajax({
            'async': false,
            'url': "https://online-mehr-geschaeft.de/treaction/dev-master-clint-formUI/polling.php",
            'success': function (data) {
                jsonTemp = data;
            }
        });
        return jsonTemp;
    }();

    backend = JSON.parse(backend);


    questions = backend.questions;
    let desc = backend.desc;
    let layoutStatus = desc.layout_status_id;

    let questionsNumber = questions.length;
    let surveyDescription = desc.survey_description;
//Make all the things under switch cases s fuctions(easy to control events)
//function generateSchema 
// input -------> questions form backend
//output -------> two jsons 1.properties (they merge and go into alpaca function)


    function generateProperties(questions) {
        let questionsNumber = questions.length;

        let properties = {};

        if (questionsNumber > 0) {

            $.each(questions, function (i) {

                let question = questions[i].question_json_representation;

                let type = question.type;

                let ID = questions[i].question_id;

                let propertie = {};

                switch (type) {
                    case 'select':
                        let optionsSelect = {};
                        select = question.select;
                        optionsSelect = select.options;
                        let value = [];
                        $.each(optionsSelect, function (i) {
                            optionValue = optionsSelect[i];
                            goto = optionValue.goto;
                            valuetext = optionValue.value;
                            //make it as array
                            value.push(valuetext);
                        });
                        propertie = {
                            "properties": {
                                [ID]: {
                                    "enum": value
                                }}
                        };
                        break;
                    case 'range':
                        let option = {};
                        range = question.range;
                        option = range.options;
                        valuesRange = option[1];
                        max = parseInt(valuesRange.max);
                        min = parseInt(valuesRange.min);
                        step = parseInt(valuesRange.step);
                        propertie = {
                            "properties": {
                                [ID]: {
                                    "minimum": min,
                                    "maximum": max,
                                    "step":step
                                }}
                        };
                        break;
                    case 'textarea':
                        propertie = {
                            "properties": {
                                [ID]: {
                                    "type": question.type,
                                    "title": question.text
                                }
                            }
                        };
                        break;
                    case 'checkbox':
                        let optionsCheckbox = {};
                        checkbox = question.checkbox;
                        optionsCheckbox = checkbox.options;
                        let valueCheckbox = [];
                        $.each(optionsCheckbox, function (i) {
                            optionValue = optionsCheckbox[i];
                            valuetext = optionValue.value;
                            //make it as array
                            valueCheckbox.push(valuetext);
                        });
                        propertie = {"properties": {
                                [ID]: {
                                    "type": "array",
                                    "items": {
                                        "type": "string",
                                        "enum": valueCheckbox
                                    },
                                    "required": [ID]
                                }}};
                        break;
                    default:
                        alert("There is No question type");
                }
                properties = $.extend(true, {}, propertie, properties);
            });
        } else {
            alert("Schema for alpaca is not generating");
        }

        return properties;
    }
    ;
//This variables are used for mapping next questions
    let surveyMappings = [];
    let pickedValue;
    /*function generateSchema 
     input -------> questions form backend
     output -------> jsons fields (they merge and go into alpaca function)*/
    function generateFields(questions) {
        let questionsNumber = questions.length;
        let fields = {};

        if (questionsNumber > 0) {

            $.each(questions, function (i) {

                let question = questions[i].question_json_representation;
                let ID = questions[i].question_id;

                let type = question.type;

                let field = {};

                switch (type) {
                    case 'select':
                        let optionsSelect = {};
                        select = question.select;
                        optionsSelect = select.options;
                        let valueSelect = [];
                        let surveyMapping = {};
                        $.each(optionsSelect, function (i) {
                            optionValue = optionsSelect[i];
                            goto = optionValue.goto;
                            valuetext = optionValue.value;
                            //making maping
                            if(goto !== ""){
                                surveyMapping = {[ID]: {[valuetext]: [goto]}};
                                surveyMappings.push(surveyMapping);
                            };
                        });
                        let pickedValues;
                        field = {
                            "fields": {
                                [ID]: {
                                    "type": "select",
                                    "helper": question.hint,
                                    "label": question.text,
                                    "removeDefaultNone": false,
                                    "onFieldChange": function (e) {
                                        pickedValues = this.getValue();
                                        pickedValue = {[ID]: [pickedValues]};
                                        generateNextid(pickedValue);
                                    }
                                }
                            }
                        };
                        break;
                    case 'range':
                        let option = {};
                        range = question.range;
                        option = range.options;
                        valuesRange = option[1];
                        max = parseInt(valuesRange.max);
                        min = parseInt(valuesRange.min);
                        step = parseInt(valuesRange.step);

                        field = {
                            "fields": {
                                [ID]: {
                                    "type": "integer",
                                    "label": question.text,
                                    "helper": question.hint,
                                    "slider":true,
                                    "onFieldChange": function (e) {
                                        rangeValue = this.getValue();
                                        alert(rangeValue);
                                        displayRange(rangeValue);
                                    }
                                }
                            }
                        };
                        break;
                    case 'textarea':

                        field = {
                            "fields": {
                                [ID]: {
                                    "type": "textarea",
                                    "helper": question.hint
                                }
                            }
                        };
                        break;
                    case 'checkbox':
                        let optionsCheckbox = {};
                        checkbox = question.checkbox;
                        optionsCheckbox = checkbox.options;
                        let value = [];
                        $.each(optionsCheckbox, function (i) {
                            optionValue = optionsCheckbox[i];
                            valuetext = optionValue.value;
                            goto = optionValue.goto;
                            //make it as array
                            value.push(valuetext);
                        });
                        field = {
                            "fields": {
                                [ID]: {
                                    "label": question.text,
                                    "type": "checkbox",
                                    "optionLabels": value,
                                    "helper": question.hint
                                }}};
                        break;
                    default:
                        alert("There is No question type");
                }
                fields = $.extend(true, {}, field, fields);
            });
        } else {
            console.log("Schema for alpaca is not generating");
        }

        return fields;

    };
//Calling functions:

    let propertieFromFunction = generateProperties(questions).properties;
    let fieldFromFunction = generateFields(questions).fields;
//This variable is used for Branching
//schema for alpaca.
    let schemas = {
        "title": surveyDescription,
        "description": "To test visulazation of Dynamic form",
        "type": "object",
        "properties": {}
    };
//seperating properties
    let propertie = {
        "properties": propertieFromFunction
    };
//merging schema with properties

    let schema = $.extend(true, {}, schemas, propertie);


//dependences of properties we need to add this to schema.
    let dependeces = {"dependencies": {
            "propertykey1": ["propertykey2"],
            "propertykey3": ["propertykey4"]
        }};
//order of questions if neded, you need to add this to schema.
    let order = {};

//options for alpacaform.

    let option = {
        "fields": {
            "form": {
                "attributes": {
                    "action": "",
                    "method": "post"
                },
                "buttons": {
                    "submit": {

                    }
                }
            }

        }
    };


//seperating fields
    let field = {
        "fields": fieldFromFunction
    };
//merging fields and options
    let options = $.extend(true, {}, option, field);


    /*functiongenerate steps
     input -------> questions form backend
     output -------> Arrey of steps*/
    function generateSteps(questions) {
        let questionsNumber = questions.length;
        let steps = [];
        if (questionsNumber > 0) {
            $.each(questions, function (i) {
                stepsfill = {};
                steps.push(stepsfill);
            });
        } else {
            console.log("There are No questions");
        }

        return steps;
    }
    ;
    steps = generateSteps(questions);

    /*functiongenerate bindings
     input -------> questions form backend
     output -------> Json of bindings*/
    function generateBindings(questions) {
        let questionsNumber = questions.length;
        let bindings = {};
        if (questionsNumber > 0) {
            $.each(questions, function (i) {
                let ID = questions[i].question_id;
                bindingsFill = {[ID]: i + 1};
                bindings = $.extend(true, {}, bindingsFill, bindings);
            });
        } else {
            console.log("There are No questions");
        }
        return bindings;
    };
    
    bindings = generateBindings(questions);

//To generate view for alpaca view.
let listLayout =  generateLayoutype(layoutStatus);
let wizard = generateWizard(listLayout);
/*this function will decied with type of layout
input ---> layoutstatus from description (11 or 12)
putput bool where false = carosul and true = single page*/
function generateLayoutype(layoutStatus){
if(layoutStatus === 12){
    return true;
}else{
    return false;
}
};
//Generates wizard according to layout

function generateWizard(listLayout){
    let wizard;
    if(listLayout === true){
        wizard = {
            "title": "Welcome to the Wizard",
            "description": "Please fill things in as you wish",
            "showSteps": false,
            "showProgressBar": false
        };
    }else{
        wizard = {
            "title": "Welcome to the Wizard",
            "description": "Please fill things in as you wish",
            "bindings": bindings,
            "steps": steps,
            "showSteps": false,
            "showProgressBar": true
        };
    }
    return wizard;
}

let templates = {};

    let views = {
        "parent": "bootstrap-edit-horizontal",
        "templates": templates,
        "wizard": wizard
    };

//..********** From hear logic for branching starts *************
//taking values from select
let NextId;
let trackingNumber = 1 ;
//creating tracking
function  tracking(button,track){
    switch(button){
        case next:
            if(track){
            trackingNumber = track+2;
            }else{
            trackingNumber = trackingNumber+1;
                  };
            break;
        case previous:
            if(track){
            trackingNumber = track;
            }else{
            trackingNumber = trackingNumber-1;
                    };
            break;
    }
    trackingarray(trackingNumber);
    return trackingNumber;
}

let trackingArray = [];
//make array of sequence 
function trackingarray(number){
    trackingArray.push(number);
}
//This function clears the value of next Id 
function clearNextId(){
    NextId = undefined;
}
//This function generates Nextid
function generateNextid(pickedValue){
    if(pickedValue){
        //seperating the values from picked value
        key = Object.keys(pickedValue).toString();
        value = Object.values(pickedValue)[0].toString();
         $.each(surveyMappings, function (i) {
             if (key == Object.keys(surveyMappings[i])){
                 mappedValue = Object.values(surveyMappings[i]);
                 if(value == Object.keys(mappedValue[0])){
                     nextId = Object.values(mappedValue[0]).toString();
                     NextId = nextId-2;
                     console.log("This option will go to question",nextId);
                 }
             }
         });
    }
}
//creating next for mapping
    let next = {
        "validate": function (callback) {
            console.log("Next validate()");
            callback(true);
        },
        "click": function (e) {
            let nextId = NextId;
            if (nextId){
                clearNextId();
                tracking(next , nextId);
                this.trigger("moveToStep", {
                            "index": nextId,
                            "skipValidation": true
                        });
            }else{
                //increament tracking by 1
                tracking(next);
            }
        }
    };
    

//generating questions order in ID from backeend
function generateID(questions){
    let IDs = [];
    $.each(questions, function (i) {
                let question = questions[i].question_json_representation;
                let type = question.type;
                let ID = questions[i].question_id;
                IDs.push(ID);
            });
       return IDs;
};
//previous button
let previous = {
                    "validate": function (callback) {
                        console.log("Previous validate()");
                        callback(true);
                    },
                    "click": function (e) {
                        clearNextId();
                        let previousID = generateprevious();
                        console.log("This is previous ID",previousID);
                        if(previousID){
                            this.trigger("moveToStep", {
                            "index": previousID,
                            "skipValidation": true
                        });
                        }
                    }
                };
//function to generate previous Id
function generateprevious(){
    let arrayLength = trackingArray.length;
    
    if (arrayLength === 1){
        previousID = 0;
    }else{
         if(trackingArray[arrayLength-1] > trackingArray[arrayLength-2]){
             previousID = trackingArray[arrayLength-2];
         }else{
          previousIDTrack1 = trackingArray[arrayLength-1];
          previousIDTrack3 = trackingArray[arrayLength-3];
          if(previousIDTrack1 === previousIDTrack3){
              previousID = trackingArray[arrayLength-4];
          }else{
              let value = getOccurrence(trackingArray,previousIDTrack1);
              console.log(value);
              if (value >= 2){
                 last = trackingArray.indexOf(previousIDTrack1);
                 previousID = trackingArray[last-1];
              }else{
                  previousID = trackingArray[arrayLength-1]-1;
              }
          }
         }
    }
    
    tracking(previous , previousID);
    return previousID;
    
};
//This function is to count the occurences of same value in an array
function getOccurrence(array, value) {
    var count = 0;
    array.forEach((v) => (v === value && count++));
    return count;
}
//Buttons in view.
buttonForForm = generateButtons(listLayout);
function generateButtons(listLayout){
    let buttons ;
    if(listLayout){
        buttons = {
                "submit": {
                    "title": "Submit",
                    "validate": function (callback) {
                        console.log("Submit validate()");
                        callback(true);
                    },
                    "click": function (e) {
                        alert(JSON.stringify(this.getValue(), null, "  "));
                        $.post("//httpbin.org/post", this.getValue());
                    },
                    "id": "mySubmit",
                    "attributes": {
                        "data-test": "123"
                    }
                }
            };
    }else{
        buttons = {
                "first": {
                    "title": "Go to First Page",
                    "align": "left",
                    "click": function (e) {
                        this.trigger("moveToStep", {
                            "index": 0,
                            "skipValidation": true
                        });
                    }
                },
                "previous": previous,
                "next": next,
                "submit": {
                    "title": "All Done!",
                    "validate": function (callback) {
                        console.log("Submit validate()");
                        callback(true);
                    },
                    "click": function (e) {
                        alert(JSON.stringify(this.getValue(), null, "  "));
                        $.post("//httpbin.org/post", this.getValue());
                    },
                    "id": "mySubmit",
                    "attributes": {
                        "data-test": "123"
                    }
                }
            };
    }
    return buttons;
}
    let buttons = {
        "wizard": {
            "buttons": buttonForForm
        }
    };

//Merging buttons and view.
    let view = $.extend(true, {}, views, buttons);
//addinng data to our survey
    let data = generateData(questions);
    
    function generateData(questions){
        let questionsNumber = questions.length;
        let datas= {};

        if (questionsNumber > 0) {

            $.each(questions, function (i) {

                let question = questions[i].question_json_representation;
                let ID = questions[i].question_id;
                let data = {};
                let type = question.type;

                switch (type) {
                    case 'range':
                        let option = {};
                        range = question.range;
                        option = range.options;
                        valuesRange = option[1];
                        inital = parseInt(valuesRange.inital);

                        data = {
                                [ID]: inital
                        };
                        break;
                }
                datas= $.extend( {},datas,data);
            });
        } else {
            console.log("Schema for alpaca is not generating");
        }

        return datas;

    };
    
    
//postRender
let postRender = function postrender(control) {
    };

//Final variable to pass into alpaca.

    let alpaca = {

        "schemaSource": schema,
        "optionsSource": options,
        "viewSource": view,
        "dataSource": data,
        "postRender": postRender
    };


//Alpaca form.
    let result = $("#form").alpaca(alpaca);

});

