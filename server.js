const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const uri = 'mongodb://localhost:27017';

app.post('/api/query', async (req, res) => {
    let client; // Declare the client variable outside the try block

    try {
        client = new MongoClient(uri, { useUnifiedTopology: true });
        await client.connect();

        const database = client.db('job_data');
        const collection = database.collection('job_collection');

        const queryType = req.body.queryType;

        if (queryType === 'skills') {
            const EmpSkills = req.body.userskills;

            function getskills(EmpSkills) {
                return new RegExp(`\\b${EmpSkills}\\b`, 'i');
            }

            var query = { "skills": { $regex: getskills(EmpSkills) } };

            var projection = {
                "Company": 1
            };

            const result = await collection.find(query, projection).sort({ "Experience": -1 }).limit(15).toArray();
            console.log(result);
            res.json(result);
        } else if (queryType === 'jobRoleAndWorkType') {
            const jobRole = req.body.userjobRole;
            const workType = req.body.userworktype;
            
            console.log(jobRole);
            console.log(workType);

            const pipeline = [
                {
                    $match: {
                        Role: { $regex: new RegExp(jobRole, 'i') }, // Case-insensitive regex
                        Work_Type: { $regex: new RegExp(workType, 'i') } // Case-insensitive regex
                    }
                },
                {
                  "$group": {
                    "_id": null, // Group without creating a separate _id field
                    "Job_Portal": { "$addToSet": "$Job_Portal" }, // Use $addToSet to avoid duplicate values
                    "Role": { "$addToSet": "$Role" },
                    "Work_Type": { "$addToSet": "$Work_Type" },
                    }
                },
                // {
                //     "$sort": { "count": -1 }
                // },
                {
                    "$limit": 5
                }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            res.json(result);
            console.log(result);
        } else if (queryType === 'location') {
            const EmpLocation = req.body.userEmpLocation;

            var query = {
                "location": { $regex: new RegExp(EmpLocation, 'i') } // Case-insensitive regex
            };

            var projection = {
                "_id": 0,  // Exclude the _id field if you don't need it
                "Job_Title": 1,
                "Job_Posting_Date": 1,
                "Salary": 1,
                "skills": 1
            };

            const result = await collection.find(query, projection)
            .sort({ "Job_Posting_Date": -1 })  // Sort by posting_date in descending order (latest first)
            .limit(7)  // Limit the results to the first 15 tuples
            .toArray();  // Move toArray here

            res.json(result);
            console.log(result);
            
        } else if (queryType === 'fullQuery') {
            const JobTitle = req.body.userjobTitle;
            const jobRole = req.body.userjobRole;
            const EmpSalary = req.body.userEmpSalary;
            const EmpLocation = req.body.userEmpLocation;
            const EmpExperience = parseInt(req.body.userEmpExperience, 10);
            
            console.log(JobTitle);
            console.log(jobRole);
            console.log(EmpSalary);
            console.log(EmpLocation);
            console.log(EmpExperience);

            function getSalaryRegex(EmpSalary) {
                return new RegExp("\\$" + EmpSalary + ".*");
            }

            var query = {
                "Job_Title": { $regex: new RegExp(JobTitle, 'i') }, // Case-insensitive regex
                "Role": { $regex: new RegExp(jobRole, 'i') }, // Case-insensitive regex
                "Salary": { $regex: getSalaryRegex(EmpSalary) }, // Assuming getSalaryRegex handles case sensitivity
                "location": { $regex: new RegExp(EmpLocation, 'i') }, // Case-insensitive regex
                "Experience": EmpExperience
            };

            var projection = {
                "_id": 0,
                "Benefits": 1
            };

            const result = await collection.find(query, projection).toArray();
            res.json(result);
            console.log(result);
        } else {
            res.status(400).json({ error: 'Invalid queryType' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
