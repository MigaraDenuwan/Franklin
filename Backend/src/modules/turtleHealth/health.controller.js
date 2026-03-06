import { TurtleHealth } from './health.model.js';
import { google } from 'googleapis';
import stream from 'stream';
import path from 'path';

// Google Drive Auth Configuration
const FOLDER_ID = '1GozwiRc0y_gMstAtSxI8MV_7ZwOq8b76';
const KEYFILEPATH = path.join(process.cwd(), 'google-credentials.json');

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/drive']
});

const uploadImageToDrive = async (fileObject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    const driveService = google.drive({ version: 'v3', auth });

    const { data } = await driveService.files.create({
        media: {
            mimeType: fileObject.mimetype,
            body: bufferStream,
        },
        requestBody: {
            name: `Franklin-Diagnosis_${Date.now()}.jpg`,
            parents: [FOLDER_ID],
        },
        fields: 'id, webViewLink, webContentLink',
    });

    try {
        await driveService.permissions.create({
            fileId: data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
    } catch (permError) {
        console.warn("Could not make file public (likely an organization restriction), but it was saved successfully.", permError.message);
    }

    return data.webViewLink;
};
export const saveHealthDiagnosis = async (req, res) => {
    try {
        let { diagnosisClass, confidence, probabilities, imageUrl, notes, location } = req.body;

        if (typeof probabilities === 'string') probabilities = JSON.parse(probabilities);
        if (typeof location === 'string') location = JSON.parse(location);

        if (req.file) {
            imageUrl = await uploadImageToDrive(req.file);
        }


    const newDiagnosis = new TurtleHealth({
      diagnosisClass,
      confidence,
      probabilities,
      imageUrl,
      location,
      location,
      notes,
    });

    const savedDiagnosis = await newDiagnosis.save();

    if (diagnosisClass === "fp" || diagnosisClass === "barnacles") {
      const diseaseName =
        diagnosisClass === "fp" ? "Fibropapillomatosis (FP)" : "Barnacles";
      const confPercent = (confidence * 100).toFixed(1);

      const alert = new HatcheryAlert({
        type: "health_warning",
        message: `CRITICAL: A turtle was diagnosed with ${diseaseName} (Confidence: ${confPercent}%). Immediate isolation and medical attention required.`,
        tank: "Diagnostic Center",
        location: location
          ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
          : "Unknown",
        linkedRecordId: savedDiagnosis._id,
      });

      await alert.save();

      sendAlertToActiveUsers(alert)
        .then((count) =>
          console.log(`Health alert emails sent to ${count} user(s)`),
        )
        .catch((err) => console.error("Email failed:", err.message));
    }

    res.status(201).json({
      success: true,
      data: savedDiagnosis,
    });
  } catch (error) {
    console.error("Error saving health diagnosis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save diagnosis",
      error: error.message,
    });
  }
};

export const getHealthStats = async (req, res) => {
  try {
    // Get last 24h count
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = await TurtleHealth.countDocuments({
      timestamp: { $gte: oneDayAgo },
    });

    // Get all time stats
    const totalHealthy = await TurtleHealth.countDocuments({
      diagnosisClass: "healthy",
    });
    const totalFp = await TurtleHealth.countDocuments({ diagnosisClass: "fp" });
    const totalBarnacles = await TurtleHealth.countDocuments({
      diagnosisClass: "barnacles",
    });
    const total = totalHealthy + totalFp + totalBarnacles || 1; // avoid divide by zero

    res.json({
      recentScans,
      stats: {
        healthy: {
          count: totalHealthy,
          percentage: ((totalHealthy / total) * 100).toFixed(1),
        },
        fp: {
          count: totalFp,
          percentage: ((totalFp / total) * 100).toFixed(1),
        },
        barnacles: {
          count: totalBarnacles,
          percentage: ((totalBarnacles / total) * 100).toFixed(1),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentDiagnoses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await TurtleHealth.countDocuments();
    const diagnoses = await TurtleHealth.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      diagnoses,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      total,
    });
  } catch (error) {
    console.error("Error fetching recent diagnoses:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHealthLocations = async (req, res) => {
  try {
    const records = await TurtleHealth.find(
      { "location.lat": { $exists: true, $ne: null } },
      { diagnosisClass: 1, confidence: 1, location: 1, timestamp: 1, _id: 0 },
    ).sort({ timestamp: -1 });

    const locations = records.map((r) => ({
      lat: r.location.lat,
      lng: r.location.lng,
      class: r.diagnosisClass,
      confidence: r.confidence,
      timestamp: r.timestamp,
    }));

    res.json(locations);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDiagnosisById = async (req, res) => {
  try {
    const { id } = req.params;
    const diagnosis = await TurtleHealth.findById(id);

    if (!diagnosis) {
      return res
        .status(404)
        .json({ success: false, message: "Diagnostic record not found" });
    }

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    console.error("Error fetching diagnosis by ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
