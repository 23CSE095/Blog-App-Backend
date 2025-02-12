const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer =require('nodemailer');



const app = express();
const PORT = 5001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// MongoDB Connection (Without dotenv)
mongoose.connect('mongodb://127.0.0.1:27017/Main_Blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);


const SubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);




app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists in the subscription list
    const existingSubscription = await Subscription.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ message: 'Email is already subscribed' });
    }

    // Create new subscription
    const newSubscription = new Subscription({ email });
    await newSubscription.save();

    res.status(200).json({ message: 'Subscription successful' });
  } catch (err) {
    res.status(500).json({ message: 'Subscription failed', error: err });
  }
});




// Set up Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or any other email service you use (e.g., 'smtp.mailtrap.io')
  auth: {
    user: 'monishaumashankar111@gmail.com',  // Replace with your email address
    pass: 'iloz thdi nfpr dkko',  // Replace with your email password or an app password
  },
});

// Subscribe Route (for handling subscription and sending email)
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Set up the email content
    const mailOptions = {
      from: 'monishaumashankar111@gmail.com',  // Sender's email
      to: email,  // Recipient's email (the user's email)
      subject: 'Thank you for subscribing to our blog!',
      text: `Hello, \n\nThank you for subscribing to our blog. We are excited to share our latest content with you.\n\nBest regards,\nYour Blog Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error });
      }
      res.status(200).json({ message: 'Subscription successful, email sent!' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Subscription failed', error });
  }
});


// Unsubscribe Route
app.delete('/unsubscribe/:email', async (req, res) => {
  const { email } = req.params;

  try {
    // Find and remove the subscription based on the email
    const deletedSubscription = await Subscription.findOneAndDelete({ email });
    if (!deletedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error unsubscribing', error: err });
  }
});


// Register Route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(200).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});  

// Update Blog Route without ID in URL
app.put('/blogs/update', async (req, res) => {
  const { title, content, author, category, externalLink } = req.body;

  try {
    const updatedBlog = await Blog.findOneAndUpdate(
      { title }, // Finding by title instead of ID
      { content, author, category, externalLink },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog' });
  }
});










// Blog Schema
const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  externalLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model('Blog', BlogSchema);

// Create Blog Route
app.post('/blogs/create', async (req, res) => {
  try {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog' });
  }
});


app.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json({ blogs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs' });
  }
});


// Delete Blog Route (by title)
app.delete('/blogs/delete', async (req, res) => {
  try {
    const { title } = req.body; // Get the title from the request body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const deletedBlog = await Blog.findOneAndDelete({ title });
    if (!deletedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog deleted successfully', blog: deletedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog' });
  }
});


// Start Server
app.listen(5001, () => console.log(`Server running on http://localhost:5001`));
