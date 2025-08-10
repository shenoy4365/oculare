// import { createContext, useState, useContext } from "react";

// const AuthContext = createContext();

// export const AuthProvider = ({children}) => {
//     const [user, setUser] = useState(null);

//     const setAuth = authUser => {
//         setUser(authUser);
//     }

//     const setUserData = userData => {
//         setUser({...userData});
//     }

//     return (
//         <AuthContext.Provider value={{user, setAuth, setUserData}}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

// export const useAuth = () => useContext(AuthContext);

import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUserData } from "../services/userService";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Setup auth listener
    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // Get user data from the database
                const { success, data } = await getUserData(session.user.id);
                
                if (success && data) {
                    setUser({
                        ...session.user,
                        name: data.name,
                        apiKey: data.api_key,
                        // Add any other user fields here
                    });
                } else {
                    setUser(session.user);
                }
            }
            
            setLoading(false);
        };
        
        checkSession();
        
        // Set up subscription
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { success, data } = await getUserData(session.user.id);
                    
                    if (success && data) {
                        setUser({
                            ...session.user,
                            name: data.name,
                            apiKey: data.api_key,
                            // Add any other user fields here
                        });
                    } else {
                        setUser(session.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );
        
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const setAuth = (authUser) => {
        setUser(authUser);
    };

    const setUserData = (userData) => {
        setUser({...userData});
    };

    return (
        <AuthContext.Provider value={{user, setAuth, setUserData, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);