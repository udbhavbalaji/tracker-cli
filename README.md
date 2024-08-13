# **Tracker CLI**

## **Overview**

**Tracker CLI** is a command-line application built with Node.js that allows users to track items efficiently. The application supports creation, configuration and deletion of datasets. Each dataset can contain any number of fields, which can be of types 'text', 'number', 'date', 'flag' or 'enum'. Within each dataset, records can be added and deleted. Filtered reports can be generated for each dataset based on the fields contained in the dataset.

## **Features**

- **Dataset Management:**
  - Create new datasets
    - Allows user to specify name of dataset & number of fields that the dataset will contain.
    - If a field isn't required, you must specify a default value for the field.
    - A field of type 'enum', will only accept valid values.
  - Show datasets info
    - Allows the user to retrieve current state of dataset existing datasets, fields (with field metadata) & valid values for a field in a dataset.
  - Delete existing datasets
    - Allows the user to delete the specified dataset, along with all related files and directories.

- **Record Management:**
  - Add a record to a dataset.
  - Show dataset records
    - Allows the user to view the last 'n' records added to a dataset.
  - Delete the most-recently added record in the dataset.

- **Reporting:**
  - Generate filtered reports based on dataset records.
    - Can only filter the datasets based on 'enum'/'flag' values.
    - If the dataset contains a 'filterable date' field, then the dataset can additionally be filtered by date.

## **Getting Started**

### **Prerequisites**

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/get-npm) (usually comes with Node.js)

### **Installation**

1. **Clone the repository:**

    ```bash
    git clone https://github.com/udbhavbalaji/tracker-cli.git
    cd tracker-cli
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Link the package globally** (optional, but recommended for easier access):

    ```bash
    npm link
    ```

    This will allow you to run the app using the `tracker` command from anywhere on your system.

### **Usage**

After installation, you can start the app by running the following command:

```bash
tracker -h
```

If correctly installed, you should see something like this:

![Initial App State](/documentation/images/initialAppState.png)

Running the following command will help initialize the app. Since the config file is stored in the home directory, it requires explicit permission to create files and folders.

```bash
sudo tracker init
```

You can optionally use the '-y' flag to initialize the app with default configuration settings. For this, run the following command.

```bash
sudo tracker init -y
```

The default config looks something like this.

```json
{
  datasetsDir: '/Users/<your-username>/.tracker-cli/datasets',
  reportTargetDir: '/Users/<your-username>/Downloads',
  resourcesDir: '/Users/<your-username>/.tracker-cli/resources',
  dateFormat: 'YYYY-MM-DD'
}
```

After initialization, running the ```tracker -h``` once more will reveal the application's functional commands. You should see the following output.

![Initialized App State](/documentation/images/initializedAppState.png)

## **Commands**

### **1. Create a New Dataset**

```bash
tracker create <dataset-name> <num-fields>
```

The above command will run you through the set-up process for the dataset. It is recommended to represent the dataset name with a singular word (e.g. expense, task, etc.). The following constraints will apply when creating a dataset:

- Each field in the dataset is one of 5 types, 'text', 'number', 'date', 'flag' or 'enum'.
- A field must be marked as 'required' or 'not required'. All 'not required' fields must have a default value set and a **single** customizable alias.
- If the field is of type 'enum', the value "Unknown" is assigned as a valid value (whether its a required field or not). If its not a required field, the default value assigned is also added as a valid value for that field.
- Only 1 'filterable' date field can be set. The 'filterable' property of a field is used to filter records based on date. You **do not** need to have a 'filterable date' field in your dataset at all.

#### **Relations**

Each dataset allows you to specify 1 relation. These relations are mappings done between 2 fields of type 'enum'. Tracker-CLI only allows a many-one relation. After setting up the fields, you will be asked if you want to specify any relations in the dataset (if you have multiple 'enum' fields).

If you want to specify a relation, first select the field on the 'many' side of the relation. Finally, select the field on the 'one' side.

Your dataset is now ready!

### **2. View Application's state**

The application's current state can be viewed using the ```tracker show [commands]``` command. The following sub-commands can be used to view different properties of the current state.

#### **i. Viewing Existing Datasets**

```bash
tracker show datasets
```

The above command shows all the datasets created. The names of these are displayed in the console.

#### **ii. Viewing Existing Fields in a Dataset**

```bash
tracker show fields -d <dataset-name> [-i | --info]
```

The above command shows all the fields in a specified dataset. The names of the fields, as well as its data type is displayed in the console, along with whether the field is required or not if the optional flag (i or info) is passed. If run without the flag, only the field names are displayed in the console.

#### **iii. Viewing Valid Values in a Particular Field ('Enum' Fields Only)**

```bash
tracker show valid-values -d <dataset-name> -f <field-name>
```

This command allows you to view the values that have been added as valid for 'enum' fields. By definition, initially, the only values that should be shown is "Unknown" (along with the user-set default value, if the field is not required). We can see how to add more valid values in a bit.


#### **iv. Viewing Records of a Particular Dataset**

```bash
tracker show last <num-records> <dataset-name>
```

Now, we can finally view our data form within the application. Initially, you should get an error stating that the dataset has no records, prompting you to the command that will add data to the dataset. If table appears to be overlapped, simply re-size the terminal window to fit the entire table.

#### **v. Viewing the Application's Current Configuration**

```bash
tracker show config
```

This command displays the current configuration settings that were set up by the user with the ```sudo tracker init [-y]``` command.


### **3. Application Data Manipulation**

Now that we have the basic structure of our dataset defined, we can begin adding data through the following sub-commands.

#### **i. Adding a Valid Value to an 'Enum' Field**

```bash
tracker addto <dataset-name> <field-name> <value>
```

Using the above command will add 'value' as a valid value to the 'field-name' field in the 'dataset-name' dataset (assuming 'field-name' is an 'enum'). If adding a value to a field that has been set as the 'many' field in a relation, you will be asked to map it to a valid value in that relation's 'one' field. This will ensure correct future mapping when adding data into the dataset.

#### **ii. Adding a Record to the Dataset**

```bash
tracker track <dataset-name> <req_args> [optional_args]
```

This command adds a record to the dataset. All required fields in the dataset must be supplied as arguments, with all other non-required fields being supplied as options. For all non-required fields, their supplied default value is populated in the record. The record is displayed in console and once confirmed by the user, it is added to the dataset.

#### **iii. Deleting an existing dataset**

```bash
tracker delete <dataset-name>
```

This command deletes the supplied dataset from the application files. Once deleted, the dataset cannot be recovered and will need to be re-created using the ```tracker create``` command.

#### **iv. Deleting the Last Added Record from a dataset**

```bash
tracker delete-from <dataset-name>
```

Not to be confused with the ```tracker delete``` command, this command is used to delete the last entered record in a dataset.

### **4. Filtered Report Generation**

The following command generates a report with the specified filters. NOTE: Filters can only be applied to 'enum' or 'flag' fields. Additionally, date filtering is supported for datasets that have a 'filterable date field'.

```bash
tracker generate <dataset-name+s> [optional filters]
```

Use ```tracker generate -h``` if your dataset is not able to be found (this will list out all the datasets and their commands).

## **Use Cases**

### **1. Personal Finance Tracker**

Tracker-CLI can be used as a tool to track expenses, income/revenue as well as keep track of investments.

### **2. Habit Tracker**

Another smart use-case for Tracker-CLI is a habit tracker. With easy access in the terminal, keeping track of habits such as work-outs can be made very simple.

## **Documentation**

- **Node.js Documentation:** [https://nodejs.org/docs/](https://nodejs.org/docs/)
- **NPM Documentation:** [https://docs.npmjs.com/](https://docs.npmjs.com/)

