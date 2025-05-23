import * as userService from '../../services/userService.js';

/**
 * Register a new user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre es obligatorio'
      });
    }
    
    // Create user in database
    const user = userService.createUser(name);
    
    // Store user ID in session
    req.session.userId = user.id;
    
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
    });
  }
};

/**
 * Get the current authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is already added to req by auth middleware
    const { user } = req;
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuario actual'
    });
  }
};

/**
 * Logout the current user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        
        return res.status(500).json({
          success: false,
          error: 'Error al cerrar sesión'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión'
    });
  }
}; 