const cors = require('cors');
const express = require('express');
const app = express();
const mongodb = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/api/programs', (req, res) => {
    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            if (err) {
                res.json([]);
            }
            if (!client) {
                console.log('No client was found.');
                res.json([]);
            }
            const db = client.db();
            const programsCollection = db.collection('programs');
            const programs = await programsCollection.find().toArray();
            res.json(programs);
        }
    );
});

app.get('/api/researchareas', (req, res) => {
    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            const db = client.db();
            const researchAreasCollection = db.collection('research_areas');
            const researchAreas = await researchAreasCollection
                .find()
                .toArray();
            res.json(researchAreas);
        }
    );
});

app.get('/api/projects', (req, res) => {
    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            const db = client.db();
            const projectsCollection = db.collection('projects');
            const projects = await projectsCollection
                .aggregate([
                    {
                        $addFields: {
                            convertedProgramId: {
                                $toObjectId: '$program'
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'programs',
                            localField: 'convertedProgramId',
                            foreignField: '_id',
                            as: 'projectProgram'
                        }
                    }
                ])
                .toArray();
            res.json(projects);
        }
    );
});

app.get('/api/project/:id', (req, res) => {
    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            const db = client.db();
            const projectsCollection = db.collection('projects');
            const project = await projectsCollection
                // .findOne({
                //     _id: mongodb.ObjectId(req.params.id)
                // })
                .aggregate([
                    // { $match: { _id: mongodb.ObjectId(req.params.id) } },
                    {
                        $addFields: {
                            convertedProgramId: {
                                $toObjectId: '$program'
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'programs',
                            localField: 'convertedProgramId',
                            foreignField: '_id',
                            as: 'projectProgram'
                        }
                    },
                    {
                        $addFields: {
                            convertedResearchAreaId: {
                                $toObjectId: '$research_area'
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'research_areas',
                            localField: 'convertedResearchAreaId',
                            foreignField: '_id',
                            as: 'projectResearchArea'
                        }
                    },
                    {
                        $match: {
                            _id: mongodb.ObjectId(req.params.id)
                        }
                    }
                ])
                .toArray();
            if (project.length == 0) {
                return res.json({});
            }

            res.json(project[0]);
        }
    );
});

app.post('/api/project/new', (req, res) => {
    const projectData = {
        title: req.body.title,
        program: req.body.program,
        research_area: req.body.research_area,
        literature: req.body.literature,
        isgroupproject: req.body.isgroupproject,
        users: req.body.users
    };

    res.send(req.body);

    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            const db = client.db();
            const projectsCollection = db.collection('projects');

            const projectData = {
                title: req.body.title,
                program: req.body.program,
                research_area: req.body.researchArea,
                literature: req.body.literature,
                isgroupproject: req.body.isGroupProject,
                users: req.body.users
            };
            await projectsCollection.insertOne(projectData);
            res.end('created new object.');
        }
    );
});

app.get('/api/search/project', (req, res) => {
    mongodb.MongoClient.connect(
        process.env.CONNECTIONSTRING,
        async function (err, client) {
            const db = client.db();
            const projectsCollection = db.collection('projects');

            const lookupAggregationMap = [
                {
                    $addFields: {
                        convertedProgramId: {
                            $toObjectId: '$program'
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'programs',
                        localField: 'convertedProgramId',
                        foreignField: '_id',
                        as: 'projectProgram'
                    }
                },
                {
                    $addFields: {
                        convertedResearchAreaId: {
                            $toObjectId: '$research_area'
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'research_areas',
                        localField: 'convertedResearchAreaId',
                        foreignField: '_id',
                        as: 'projectResearchArea'
                    }
                }
            ];
            if (req.query.program) {
                lookupAggregationMap.push({
                    $match: {
                        program: req.query.program
                    }
                });
            }
            if (req.query.researcharea) {
                lookupAggregationMap.push({
                    $match: {
                        research_area: req.query.researcharea
                    }
                });
            }
            if (req.query.isgroupproject) {
                const boolIsGroupProject =
                    req.query.isgroupproject == 'yes' ? true : false;
                lookupAggregationMap.push({
                    $match: {
                        isgroupproject: boolIsGroupProject
                    }
                });
            }

            const project = await projectsCollection
                .aggregate(lookupAggregationMap)
                .toArray();
            if (project.length == 0) {
                return res.json({});
            }

            res.json(project);
        }
    );
});

app.listen(process.env.APIPORT || 3001);
