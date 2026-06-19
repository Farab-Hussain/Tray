import jobApplicationServiceDefault from './jobApplication.service';

export const ApplicationService = {
  applyForJob: jobApplicationServiceDefault.applyForJob.bind(jobApplicationServiceDefault),
  getMyApplications: jobApplicationServiceDefault.getMyApplications.bind(jobApplicationServiceDefault),
  getApplicationById: jobApplicationServiceDefault.getApplicationById.bind(jobApplicationServiceDefault),
  updateApplicationStatus: jobApplicationServiceDefault.updateApplicationStatus.bind(jobApplicationServiceDefault),
};

export default ApplicationService;
