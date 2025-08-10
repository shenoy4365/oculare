import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
    try {
        const {data, error} = await supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single();

        if (error) {
            return {success: false, msg: error.message};
        }
        return {success: true, data};
    }
    catch (error) {
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export const updateUserProfile = async (userId, userData) => {
    try {
        // Update user data in the users table
        const { data, error } = await supabase
            .from('users')
            .update({
                name: userData.name,
                api_key: userData.apiKey,
                // Add other fields if needed
            })
            .eq('id', userId);

        if (error) {
            return { success: false, msg: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.log('Error updating user profile:', error);
        return { success: false, msg: error.message };
    }
}

export const updateUserEmail = async (email) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            email: email
        });

        if (error) {
            return { success: false, msg: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.log('Error updating email:', error);
        return { success: false, msg: error.message };
    }
}

export const updateUserPassword = async (password) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            return { success: false, msg: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        console.log('Error updating password:', error);
        return { success: false, msg: error.message };
    }
}

export const logoutUser = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return { success: false, msg: error.message };
        }
        
        return { success: true };
    } catch (error) {
        console.log('Error logging out:', error);
        return { success: false, msg: error.message };
    }
}