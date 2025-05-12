import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/TagIDLogo.png";
import { Server } from '../App';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInputGroup,
    MDBInput,
    MDBIcon
} from 'mdb-react-ui-kit';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import '../Styles/Login.css';

function Login() {
    const [UserName, setUserName] = useState('');
    const [Password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userData = Cookies.get('userData');
        if (!userData) {
            navigate('/');
        } else {
            navigate('/Home');
        }
    }, [navigate]);

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${Server}/token`, {
                username: UserName,
                password: Password,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            if (response.data.token_type === "bearer") {
                Cookies.set('userData', JSON.stringify(response.data), { expires: 2, path: '' });
                toast.success('Login successful!');
                navigate('/Home');
            }
        } catch (error) {
            toast.error(error?.response?.data?.detail || 'An error occurred during login.');
            console.error(error);
        }
    };

    return (
        <MDBContainer fluid className='login-background'>
            <MDBRow className='d-flex justify-content-center align-items-center h-100 flex-column fade-in pt-5'>
                <img style={{ width: "270px" }} src={logo} alt='TagID Logo' />
                <MDBCol col='12' >
                    <MDBCard className='text-black my-5 mx-auto animated-card' style={{ borderRadius: '2rem', maxWidth: '450px' }}>
                        <MDBCardBody className='p-5 d-flex flex-column align-items-center mx-auto w-100'>
                            <div className='d-flex flex-row mb-4'>
                                <h3 className="fw-bold text-uppercase" style={{ color: "#0892d0" }}>Log</h3>
                                <h3 className="fw-bold text-uppercase ms-1" style={{ color: "orange" }}>in</h3>
                            </div>
                            <MDBInputGroup className='mb-4 w-100 align-items-center custom-input-group'>
                                <span className='input-group-text custom-icon me-1'>
                                    <MDBIcon fas icon="user" />
                                </span>
                                <MDBInput
                                    label='Username' 
                                    type='text'
                                    size="lg"
                                    value={UserName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className='custom-mdb-input'
                                />
                            </MDBInputGroup>

                            <MDBInputGroup className='mb-4 w-100 align-items-center custom-input-group'>
                                <span className='input-group-text custom-icon me-1'>
                                    <MDBIcon fas icon="lock" />
                                </span>
                                <MDBInput
                                    label='Password'
                                    type='password'
                                    size="lg"
                                    value={Password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className='custom-mdb-input'
                                />
                            </MDBInputGroup>

                            <MDBBtn
                                outline
                                className='mx-2 px-5 animated-btn'
                                color='dark'
                                size='lg'
                                onClick={handleLogin}
                            >
                                Login
                            </MDBBtn>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
}

export default Login;
