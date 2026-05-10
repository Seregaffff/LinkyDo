import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosFetch, generateImageURL } from '../../../utils';
import './Register.scss'

const Register = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formInput, setFormInput] = useState({
    username: "",
    email: "",
    password: "",
    phone: '',
    description: '',
    isSeller: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation for required fields
    for (let key in formInput) {
      if (key === 'isSeller') continue; // Skip checkbox validation
      if (formInput[key] === '') {
        toast.error('Please fill all input fields: ' + key);
        return;
      }
    }

    // Phone validation (if phone is provided)
    if (formInput.phone && formInput.phone.length < 9) {
      toast.error('Enter valid phone number!');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formInput.email)) {
      toast.error('Please enter a valid email address!');
      return;
    }

    // Password validation (minimum 6 characters)
    if (formInput.password.length < 6) {
      toast.error('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);
    
    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (image) {
        try {
          const result = await generateImageURL(image);
          imageUrl = result.url || '';
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          toast.error('Failed to upload image, but continuing with registration...');
        }
      }
      
      // Prepare data for API
      const userData = {
        username: formInput.username,
        email: formInput.email,
        password: formInput.password,
        phone: formInput.phone || '',
        description: formInput.description || '',
        isSeller: formInput.isSeller || false,
        img: imageUrl,
        country: 'Unknown' // Default country
      };
      
      // Send registration request
      const { data } = await axiosFetch.post('/auth/register', userData);
      
      if (data && (data.token || data.user)) {
        toast.success('Registration successful! Please login.');
        setLoading(false);
        
        // Clear form
        setFormInput({
          username: "",
          email: "",
          password: "",
          phone: '',
          description: '',
          isSeller: false,
        });
        setImage(null);
        
        // Navigate to login page after short delay
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error('Registration failed. Please try again.');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Registration failed!';
        toast.error(errorMessage);
      } else if (error.request) {
        // Request was made but no response
        toast.error('Network error! Please check if server is running.');
      } else {
        // Something else happened
        toast.error(error.message || 'Registration failed! Please try again.');
      }
      
      setLoading(false);
    }
  }

  const handleChange = (event) => {
    const { value, name, type, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;
    setFormInput({
      ...formInput,
      [name]: inputValue
    });
  }

  return (
    <div className="register">
      <form onSubmit={handleSubmit}>
        <div className="left">
          <h1>Create a new account</h1>
          
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="johndoe"
            value={formInput.username}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            value={formInput.email}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            name="password" 
            type="password" 
            placeholder="Minimum 6 characters"
            value={formInput.password}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="profilePicture">Profile Picture (Optional)</label>
          <input 
            id="profilePicture"
            type="file" 
            accept="image/*"
            onChange={(event) => setImage(event.target.files[0])} 
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </div>
        
        <div className="right">
          <p>Already have an account? <Link to='/login'>Sign In</Link></p>
          
          <h1>I want to become a seller</h1>
          <div className="toggle">
            <label htmlFor="isSeller">Activate the seller account</label>
            <label className="switch">
              <input 
                id="isSeller"
                type="checkbox" 
                name="isSeller" 
                checked={formInput.isSeller}
                onChange={handleChange} 
              />
              <span className="slider round"></span>
            </label>
          </div>
          
          <label htmlFor="phone">Phone Number (Optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 1234 567 890"
            value={formInput.phone}
            onChange={handleChange}
          />
          
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            placeholder="A short description of yourself"
            name="description"
            cols="30"
            rows="10"
            value={formInput.description}
            onChange={handleChange}
          />
        </div>
      </form>
    </div>
  )
}

export default Register