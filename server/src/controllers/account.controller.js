import ResponseUtils from '../utils/ResponseUtils.js';
import userService from '../services/users.service.js';
import authServices from '../services/auth.service.js';

export const getInfo = async (req, res, next) => {
  try {
    const user = await userService.getOneById(req.user._id);
    if (user) {
      ResponseUtils.status200(res, `Get info successfully!`, user);
    } else {
      ResponseUtils.status404(res, `User not found!`);
    }
  } catch (err) { next(err); }
}

export const updateInfo = async (req, res, next) => {
  try {
    const updateUser = await userService.updateBasicInfo(req.user._id, req.body);
    if (updateUser) {
      ResponseUtils.status200(
        res,
        `Update info successfully!`,
        updateUser
      );
    } else {
      ResponseUtils.status404(res, `User not found!`);
    }
  } catch (err) { next(err); }
}

export const updateEmail = async (req, res, next) => {
  try {
    const updateUser = await userService.updateEmail(req.user._id, req.body);
    if (updateUser) {
      ResponseUtils.status200(
        res,
        `Update email successfully!`,
        updateUser
      );
    } else {
      ResponseUtils.status404(res, `User not found!`);
    }
  } catch (err) { next(err); }
}

export const updatePhone = async (req, res, next) => {
  try {
    const updateUser = await userService.updatePhone(req.user._id, req.body);
    if (updateUser) {
      ResponseUtils.status200(
        res,
        `Update phone successfully!`,
        updateUser
      );
    } else {
      ResponseUtils.status404(res, `User not found!`);
    }
  } catch (err) { next(err); }
}

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    const result = await authServices.changePassword(userId, currentPassword, newPassword);
    if (result) {
      ResponseUtils.status200(res, `Change password successfully!`, result);
    } else {
      ResponseUtils.status404(res, `Change password failed`);
    }
  } catch (err) { next(err); }
};

export const isExistedEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const isExisted = await userService.isExistEmail(email);
    ResponseUtils.sendJson(res, 200, '', { isExisted });
  } catch (err) { next(err); }
};

export const isExistedPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const isExisted = await userService.isExistPhone(phone);
    ResponseUtils.sendJson(res, 200, '', { isExisted });
  } catch (err) { next(err); }
};

// ============================================
// NOTE: Address management removed
// Movie streaming platform doesn't need shipping addresses
// If needed in future, can be re-added
// ============================================