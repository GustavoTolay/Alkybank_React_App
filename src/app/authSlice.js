import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import jwt_decode from 'jwt-decode'
import alerts from '../services/alerts'
import { getRequest, postRequest, putRequest } from '../services/httpRequest'

export const userRegister = createAsyncThunk(
  'USER_REGISTER',
  async (data, thunkAPI) => {
    try {
      const { body } = await postRequest('/users/register', data)
      const token = body.encrypted
      const user = jwt_decode(token)

      return { user, token }
    } catch (error) {
      return thunkAPI.rejectWithValue('Something went wrong') //Cuando tengamos el formulario de register cambio el mensaje
    }
  }
)

export const userLogin = createAsyncThunk(
  'USER_LOGIN',
  async (data, thunkAPI) => {
    try {
      const { body: token } = await postRequest('/auth/login', data)
      const user = jwt_decode(token)

      return { user, token }
    } catch (error) {
      return thunkAPI.rejectWithValue('Something went wrong') //Cuando tengamos el formulario de login cambio el mensaje
    }
  }
)

export const getUserById = createAsyncThunk(
  'USER_GET',
  async (id, thunkAPI) => {
    try {
      const { body } = await getRequest(`/users/${id}`)
      const token = body.encrypted
      const user = jwt_decode(token)

      return { user, token }
    } catch (error) {
      return thunkAPI.rejectWithValue('Something went wrong') //Cuando tengamos el formulario de login cambio el mensaje
    }
  }
)

export const updateUser = createAsyncThunk(
  'USER_UPDATE',
  async ({ changes, id }, thunkAPI) => {
    try {
      const { code } = await putRequest(`/users/${id}`, changes, {
        'Content-Type': 'multipart/form-data',
      })

      // User retrieved successfully:
      if (code === 202) {
        thunkAPI.dispatch(getUserById(id))
        alerts.confirmAlert('Usuario actualizado correctamente')
      }
    } catch (error) {
      return thunkAPI.rejectWithValue('Something went wrong') //Cuando tengamos el formulario de register cambio el mensaje
    }
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    token: null,
    error: null,
  },
  reducers: {
    getUserFromLocalStorage: state => {
      const token = localStorage.getItem('token')

      if (token) {
        const user = jwt_decode(token)
        state.token = token
        state.user = user
      }
    },
    logout: state => {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('token')
    },
  },
  extraReducers: builder => {
    builder
      // REGISTER
      .addCase(userRegister.pending, (state, action) => {
        state.loading = true
      })
      .addCase(userRegister.fulfilled, (state, action) => {
        const { user, token } = action.payload

        localStorage.setItem('token', token)

        state.user = user
        state.token = token
        state.loading = false
      })
      .addCase(userRegister.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // LOGIN
      .addCase(userLogin.pending, (state, action) => {
        state.loading = true
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        const { user, token } = action.payload

        localStorage.setItem('token', token)

        state.user = user
        state.token = token
        state.loading = false
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // UPDATE
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        alerts.errorAlert(
          'Algo salió mal',
          'Inténtalo de nuevo o prueba cambiando la imagen'
        )
      })

      // GET USER
      .addCase(getUserById.pending, (state, action) => {
        state.loading = true
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        const { user, token } = action.payload

        localStorage.setItem('token', token)

        state.user = user
        state.token = token
        state.loading = false
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const getUser = state => state.user.user
export const getToken = state => state.user.token
export const getUserIsLoading = state => state.user.loading
export const getUserError = state => state.user.error

export const { getUserFromLocalStorage, logout } = userSlice.actions

export default userSlice.reducer
