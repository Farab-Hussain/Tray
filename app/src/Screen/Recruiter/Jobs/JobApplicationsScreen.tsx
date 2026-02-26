import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { useRefresh } from '../../../hooks/useRefresh';
import { jobApplicationsScreenStyles } from '../../../constants/styles/jobApplicationsScreenStyles';
import { getStatusColor } from '../../../utils/statusUtils';
import SummaryCard from '../../../components/ui/SummaryCard';
import { AIProvider, AIService } from '../../../services/ai.service';

const JobApplicationsScreen = ({ navigation, route }: any) => {
  const { jobId } = route.params;
  const [applications, setApplications] = useState<any[]>([]);
  const [rankedApplications, setRankedApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiRankingLoading, setAiRankingLoading] = useState(false);
  const [talentAdviceLoading, setTalentAdviceLoading] = useState(false);
  const [talentAdvice, setTalentAdvice] = useState<string[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<{
    totalSnapshots: number;
    latestSavedAt: string;
    readyNowDelta: number;
    averageRankScoreDelta: number;
  } | null>(null);

  const parsePossibleJSON = (text: string) => {
    const cleaned = text
      .trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  };

  const getTimestampMillis = (value: any): number => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    if (typeof value?._seconds === 'number') return value._seconds * 1000;
    return 0;
  };

  const getLocationMatch = (jobLocation?: string, candidateLocation?: string) => {
    const job = (jobLocation || '').toLowerCase();
    const candidate = (candidateLocation || '').toLowerCase();
    if (!job || !candidate) return 50;
    if (job.includes('remote') && candidate.includes('remote')) return 100;
    if (job === candidate) return 100;
    if (job.includes(candidate) || candidate.includes(job)) return 80;
    return 40;
  };

  const getAvailabilityMatch = (app: any) => {
    const daysCount = Array.isArray(app?.resume?.shiftFlexibility?.days)
      ? app.resume.shiftFlexibility.days.length
      : 0;
    if (daysCount >= 5) return 100;
    if (daysCount >= 3) return 75;
    if (daysCount > 0) return 60;
    return 50;
  };

  const getCompliancePass = (app: any) => {
    if (typeof app?.complianceEvaluation?.pass === 'boolean') {
      return app.complianceEvaluation.pass;
    }
    if (app?.resume?.workAuthorized === false) return false;
    const restrictions = Array.isArray(app?.resume?.workRestrictions)
      ? app.resume.workRestrictions.length
      : 0;
    return restrictions <= 5;
  };

  const buildLocalRanking = useCallback((items: any[]) => {
    return [...items]
      .map(app => {
        const required = app?.job?.requiredSkills?.length || 0;
        const skillMatchPercent =
          required > 0
            ? Math.round(((app?.matchScore || 0) / required) * 100)
            : 50;
        const availabilityMatch = getAvailabilityMatch(app);
        const locationMatch = getLocationMatch(
          app?.job?.location,
          app?.resume?.personalInfo?.location || app?.user?.location,
        );
        const compliancePass = getCompliancePass(app);
        const complianceScore = compliancePass ? 100 : 20;
        const overallRankScore = Math.round(
          skillMatchPercent * 0.55 +
            availabilityMatch * 0.2 +
            locationMatch * 0.15 +
            complianceScore * 0.1,
        );
        const readyNow = overallRankScore >= 75 && compliancePass;

        return {
          ...app,
          aiRank: {
            skillMatchPercent,
            availabilityMatch,
            locationMatch,
            compliancePass,
            overallRankScore,
            readyNow,
          },
        };
      })
      .sort((a, b) => (b.aiRank?.overallRankScore || 0) - (a.aiRank?.overallRankScore || 0));
  }, []);

  const saveTrendSnapshot = useCallback(
    async (
      ranked: any[],
      provider: AIProvider | 'local',
      trigger: 'ai_ranking' | 'shortage_advice' | 'manual',
      advice?: string[],
    ) => {
      const shortageDetected =
        ranked.length === 0 || ranked.filter(app => app?.aiRank?.readyNow).length === 0;

      await JobService.saveAISnapshot(jobId, {
        provider,
        trigger,
        ranking: ranked.slice(0, 50).map(app => ({
          applicationId: app.id,
          userId: app.userId || app.user?.id,
          name: app.user?.name || 'Applicant',
          skillMatchPercent: app?.aiRank?.skillMatchPercent,
          availabilityMatch: app?.aiRank?.availabilityMatch,
          locationMatch: app?.aiRank?.locationMatch,
          compliancePass: app?.aiRank?.compliancePass,
          overallRankScore: app?.aiRank?.overallRankScore,
          readyNow: app?.aiRank?.readyNow,
          note: app?.aiRank?.aiNote || '',
        })),
        shortage: {
          detected: shortageDetected,
          alerts: advice || [],
          relaxNonEssentialRequirements: advice || [],
          consultingServiceActions: advice || [],
        },
        metadata: {
          candidateCount: ranked.length,
          readyNowCount: ranked.filter(app => app?.aiRank?.readyNow).length,
        },
      });
    },
    [jobId],
  );

  const loadSnapshotHistory = useCallback(async () => {
    try {
      const data = await JobService.getAISnapshots(jobId, 20);
      const latest = data?.snapshots?.[0];
      if (!latest) {
        setSnapshotStats(null);
        return;
      }

      const createdAtMs = getTimestampMillis(latest.createdAt);
      setSnapshotStats({
        totalSnapshots: data?.trend?.totalSnapshots || data?.snapshots?.length || 1,
        latestSavedAt: createdAtMs ? new Date(createdAtMs).toLocaleString() : 'N/A',
        readyNowDelta: data?.trend?.readyNowDelta || 0,
        averageRankScoreDelta: data?.trend?.averageRankScoreDelta || 0,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load AI snapshot history:', error);
      }
    }
  }, [jobId]);

  const applyRankOrderFromAI = (baseRanked: any[], aiData: any) => {
    const order = Array.isArray(aiData?.ranked_candidate_ids)
      ? aiData.ranked_candidate_ids
      : [];
    if (!order.length) return baseRanked;

    const byId = new Map(baseRanked.map(item => [item.id, item]));
    const ordered = order
      .map((id: string) => byId.get(id))
      .filter(Boolean)
      .map((item: any) => ({ ...item }));
    const remaining = baseRanked.filter(item => !order.includes(item.id));

    const noteMap = new Map(
      Array.isArray(aiData?.candidate_notes)
        ? aiData.candidate_notes.map((n: any) => [n.id, n])
        : [],
    );

    const merged = [...ordered, ...remaining].map(item => {
      const note = noteMap.get(item.id);
      if (!note) return item;
      return {
        ...item,
        aiRank: {
          ...item.aiRank,
          readyNow:
            typeof note.ready_now === 'boolean'
              ? note.ready_now
              : item.aiRank?.readyNow,
          aiNote: note.note || '',
        },
      };
    });
    return merged;
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const [response] = await Promise.all([
        JobService.getJobApplications(jobId),
        loadSnapshotHistory(),
      ]);
      const list = response.applications || [];
      setApplications(list);
      setRankedApplications(buildLocalRanking(list));
      setTalentAdvice([]);
      setSummary(response.summary || null);
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching applications:', error)
      };
      showError(error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [buildLocalRanking, jobId, loadSnapshotHistory]);

  const openProviderPicker = (
    title: string,
    action: (provider: AIProvider) => Promise<void> | void,
  ) => {
    Alert.alert(title, 'Choose AI provider', [
      { text: 'OpenAI', onPress: () => action('openai') },
      { text: 'Claude', onPress: () => action('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAIRankCandidates = async (provider: AIProvider) => {
    if (!applications.length) {
      showError('No candidates available to rank');
      return;
    }

    try {
      setAiRankingLoading(true);
      const baseRanked = buildLocalRanking(applications);
      const promptPayload = baseRanked.map(app => ({
        id: app.id,
        name: app.user?.name || 'Applicant',
        skill_match_percent: app.aiRank?.skillMatchPercent,
        availability_match: app.aiRank?.availabilityMatch,
        location_match: app.aiRank?.locationMatch,
        compliance_pass: app.aiRank?.compliancePass,
      }));

      const result = await AIService.generateGeneric({
        provider,
        json_mode: true,
        max_tokens: 700,
        system_prompt:
          'You are a hiring ranking assistant. Rank candidates for immediate placement. Return ONLY valid JSON.',
        user_prompt: `Rank these candidates by: skill match %, availability match, location match, compliance pass/fail.
Mark ready_now true only for strong immediate-fit profiles.
Return JSON:
{
  "ranked_candidate_ids": ["id1", "id2"],
  "candidate_notes": [{"id":"id1","ready_now":true,"note":"short reason"}]
}
Candidates:
${JSON.stringify(promptPayload)}`,
      });

      const parsed = parsePossibleJSON(result?.output || '{}');
      const ranked = applyRankOrderFromAI(baseRanked, parsed);
      setRankedApplications(ranked);
      try {
        await saveTrendSnapshot(ranked, provider, 'ai_ranking');
        await loadSnapshotHistory();
      } catch (snapshotError) {
        if (__DEV__) {
          console.error('Failed to persist AI ranking snapshot:', snapshotError);
        }
      }
      showSuccess('AI ranking completed');
    } catch (error: any) {
      if (__DEV__) {
        console.error('AI ranking failed, using local ranking:', error);
      }
      const fallbackRanked = buildLocalRanking(applications);
      setRankedApplications(fallbackRanked);
      try {
        await saveTrendSnapshot(fallbackRanked, 'local', 'manual');
        await loadSnapshotHistory();
      } catch (snapshotError) {
        if (__DEV__) {
          console.error('Failed to persist fallback ranking snapshot:', snapshotError);
        }
      }
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'AI ranking failed, local ranking applied.',
      );
    } finally {
      setAiRankingLoading(false);
    }
  };

  const handleTalentShortageAdvice = async (provider: AIProvider) => {
    try {
      setTalentAdviceLoading(true);
      const topMissing = (displayedApplications || [])
        .flatMap((app: any) =>
          Array.isArray(app?.missingSkills) ? app.missingSkills : [],
        )
        .slice(0, 10);

      const result = await AIService.generateGeneric({
        provider,
        json_mode: true,
        max_tokens: 600,
        system_prompt:
          'You are a recruiting strategy assistant. Return concise shortage mitigation actions in JSON only.',
        user_prompt: `Context:
- Total candidates: ${displayedApplications.length}
- Ready-now candidates: ${readyNowCount}
- Common missing skills: ${topMissing.join(', ') || 'none'}

Return JSON:
{
  "alerts": ["..."],
  "relax_non_essential_requirements": ["..."],
  "consulting_service_actions": ["..."]
}`,
      });

      const parsed = parsePossibleJSON(result?.output || '{}');
      const alerts = Array.isArray(parsed?.alerts) ? parsed.alerts : [];
      const relax = Array.isArray(parsed?.relax_non_essential_requirements)
        ? parsed.relax_non_essential_requirements
        : [];
      const consulting = Array.isArray(parsed?.consulting_service_actions)
        ? parsed.consulting_service_actions
        : [];
      const combinedAdvice = [...alerts, ...relax, ...consulting].slice(0, 8);
      setTalentAdvice(combinedAdvice);

      const baseRanked = rankedApplications.length
        ? rankedApplications
        : buildLocalRanking(applications);
      try {
        await saveTrendSnapshot(baseRanked, provider, 'shortage_advice', combinedAdvice);
        await loadSnapshotHistory();
      } catch (snapshotError) {
        if (__DEV__) {
          console.error('Failed to persist shortage snapshot:', snapshotError);
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Talent shortage advice failed:', error);
      }
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to generate talent shortage advice.',
      );
    } finally {
      setTalentAdviceLoading(false);
    }
  };

  const displayedApplications = useMemo(() => {
    return rankedApplications.length ? rankedApplications : applications;
  }, [applications, rankedApplications]);

  const readyNowCount = useMemo(() => {
    return displayedApplications.filter(app => app?.aiRank?.readyNow).length;
  }, [displayedApplications]);

  const talentShortage = useMemo(() => {
    return displayedApplications.length === 0 || readyNowCount === 0;
  }, [displayedApplications.length, readyNowCount]);

  const { refreshing, handleRefresh } = useRefresh(fetchApplications);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications]),
  );

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return COLORS.gray;
    }
  };

  const getRatingLabel = (rating?: string) => {
    switch (rating) {
      case 'gold':
        return '⭐ Gold';
      case 'silver':
        return '⭐ Silver';
      case 'bronze':
        return '⭐ Bronze';
      case 'basic':
        return 'Basic';
      default:
        return 'N/A';
    }
  };


  const formatApplicationDate = (appliedAt?: any, createdAt?: any): string => {
    const dateValue = appliedAt || createdAt;
    
    if (!dateValue) {
      return 'N/A';
    }
    
    let date: Date;
    
    // Handle different date formats
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (dateValue.seconds !== undefined) {
        // Firestore timestamp format: { seconds: number }
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue._seconds !== undefined) {
        // Alternative Firestore timestamp format
        date = new Date(dateValue._seconds * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'N/A';
      }
    } else if (typeof dateValue === 'number') {
      // Already a timestamp (milliseconds or seconds)
      date = new Date(dateValue > 1000000000000 ? dateValue : dateValue * 1000);
    } else if (typeof dateValue === 'string') {
      // ISO string or other string format
      date = new Date(dateValue);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString();
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Applications"
          onBackPress={() => navigation.goBack()}
        />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Applications"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Summary Card */}
        {summary && (
          <SummaryCard
            title="Application Summary"
            stats={[
              { label: 'Gold', value: summary.gold || 0, color: '#FFD700' },
              { label: 'Silver', value: summary.silver || 0, color: '#C0C0C0' },
              { label: 'Bronze', value: summary.bronze || 0, color: '#CD7F32' },
              { label: 'Total', value: summary.total || 0 },
            ]}
          />
        )}

        <View style={styles.aiPanel}>
          <Text style={styles.aiPanelTitle}>AI Candidate Ranking Engine</Text>
          <Text style={styles.aiPanelText}>
            Ranked by skill match, availability, location, and compliance.
          </Text>
          <Text style={styles.aiPanelText}>
            Ready Now candidates: {readyNowCount}/{displayedApplications.length}
          </Text>
          {snapshotStats ? (
            <Text style={styles.aiPanelText}>
              Trend snapshots: {snapshotStats.totalSnapshots} | Last saved:{' '}
              {snapshotStats.latestSavedAt}
            </Text>
          ) : null}
          {snapshotStats ? (
            <Text style={styles.aiPanelText}>
              Ready-now delta: {snapshotStats.readyNowDelta >= 0 ? '+' : ''}
              {snapshotStats.readyNowDelta} | Avg rank delta:{' '}
              {snapshotStats.averageRankScoreDelta >= 0 ? '+' : ''}
              {snapshotStats.averageRankScoreDelta}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={() =>
              openProviderPicker('AI Rank Candidates', handleAIRankCandidates)
            }
            disabled={aiRankingLoading || !applications.length}
            style={[
              styles.aiActionButton,
              (aiRankingLoading || !applications.length) &&
                styles.aiActionButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.aiActionButtonText}>
              {aiRankingLoading ? 'Ranking...' : 'Run AI Ranking'}
            </Text>
          </TouchableOpacity>
        </View>

        {talentShortage ? (
          <View style={styles.shortagePanel}>
            <Text style={styles.shortageTitle}>Talent Shortage Alert</Text>
            <Text style={styles.shortageText}>
              No ready-now candidate match detected for this role.
            </Text>
            <TouchableOpacity
              onPress={() =>
                openProviderPicker(
                  'AI Talent Shortage Advice',
                  handleTalentShortageAdvice,
                )
              }
              disabled={talentAdviceLoading}
              style={[
                styles.aiActionButton,
                talentAdviceLoading && styles.aiActionButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.aiActionButtonText}>
                {talentAdviceLoading ? 'Analyzing...' : 'Get AI Shortage Advice'}
              </Text>
            </TouchableOpacity>
            {talentAdvice.length > 0 ? (
              <View style={styles.shortageAdviceBox}>
                {talentAdvice.map((tip, idx) => (
                  <Text key={`${tip}-${idx}`} style={styles.shortageAdviceText}>
                    • {tip}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Applications List - Ranked */}
        {displayedApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Applications will appear here once candidates apply
            </Text>
          </View>
        ) : (
          displayedApplications.map(application => (
            <TouchableOpacity
              key={application.id}
              onPress={() =>
                navigation.navigate('RecruiterApplicationReview', {
                  applicationId: application.id,
                })
              }
              style={[
                styles.applicationCard,
                { borderLeftColor: getRatingColor(application.matchRating) },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.applicantName} numberOfLines={1}>
                    {application.user?.name || 'Applicant'}
                  </Text>
                  <Text style={styles.applicantEmail} numberOfLines={1}>
                    {application.user?.email || ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ratingBadge,
                    {
                      backgroundColor: getRatingColor(application.matchRating),
                    },
                  ]}
                >
                  <Text style={styles.ratingText}>
                    {getRatingLabel(application.matchRating)}
                  </Text>
                </View>
              </View>
              {application?.aiRank?.readyNow ? (
                <View style={styles.readyNowBadge}>
                  <Text style={styles.readyNowText}>Ready Now</Text>
                </View>
              ) : null}

              <View style={styles.matchContainer}>
                <Text style={styles.matchLabel}>Match Score</Text>
                <Text style={styles.matchValue}>
                  {application.matchScore}/
                  {application.job?.requiredSkills?.length || 0} skills matched
                </Text>
                {application?.aiRank ? (
                  <Text style={styles.aiSubMetric}>
                    AI Rank: {application.aiRank.overallRankScore}% · Availability:{' '}
                    {application.aiRank.availabilityMatch}% · Location:{' '}
                    {application.aiRank.locationMatch}% · Compliance:{' '}
                    {application.aiRank.compliancePass ? 'Pass' : 'Review'}
                  </Text>
                ) : null}
                {application?.aiRank?.aiNote ? (
                  <Text style={styles.aiSubMetric}>Note: {application.aiRank.aiNote}</Text>
                ) : null}
              </View>

              {application.matchedSkills &&
                application.matchedSkills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    <Text style={styles.skillsLabel}>Matched Skills:</Text>
                    <View style={styles.skillsList}>
                      {application.matchedSkills
                        .slice(0, 3)
                        .map((skill: string, index: number) => (
                          <View key={index} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      {application.matchedSkills.length > 3 && (
                        <Text style={styles.moreSkillsText}>
                          +{application.matchedSkills.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

              <View style={styles.footer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(application.status, 'application') },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {application.status && typeof application.status === 'string'
                      ? String(application.status).charAt(0).toUpperCase() + 
                        String(application.status).slice(1)
                      : 'Pending'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {formatApplicationDate(application.appliedAt, application.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = jobApplicationsScreenStyles;

export default JobApplicationsScreen;
