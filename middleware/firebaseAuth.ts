import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseToken(request: NextRequest): Promise<FirebaseUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return null;
  }
}

// Higher-order function to protect API routes
export function withFirebaseAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const user = await verifyFirebaseToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }
    
    // Attach user to request context
    return handler(request, context, user);
  };
}