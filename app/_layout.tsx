import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase";
import {getUserData} from "../services/userService";

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

const MainLayout = () => {
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();

    useEffect(() => {
      supabase.auth.onAuthStateChange((_event, session) => {

        if (session) {
          setAuth(session?.user);
          router.replace('/screens/home');
        }
        else {
          setAuth(null);
          router.replace('/welcome');
        }
      })
    }, []);

    const updateUserData = async (user: any) => {
      let res = await getUserData(user?.id);
      if (res.success) {
        setUserData(res.data);
      }
    }

  return (
    <Stack 
        screenOptions={{
          headerShown: false
        }}
    />
  )
}

export default _layout