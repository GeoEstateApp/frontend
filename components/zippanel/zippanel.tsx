import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useDebouncedEffect } from '@/hooks/utility-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useZipcodeInsights, ZipcodeData, ZipcodeInsight } from '@/states/zipcode_insights';
import { convexHull, PolygonCoordinates } from '@/api/osm';
import { addComment, Comment, getComments } from '@/api/comments';
import Toast from 'react-native-toast-message';
import { IconUser, IconSend } from '@tabler/icons-react';

export default function ZipPanel() {
  const [searchingZipcodeText, setSearchingZipcodeText] = useState<string>('');
  const [zipcodeList, setZipcodeList] = useState<ZipcodeData[]>([]);
  const [viewingZipcodeDetails, setViewingZipcodeDetails] = useState<string | null>(null); // New state to track details view
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const { zipcode, zipcodes, setPolygon, setZipcode, setZipcodes, setZipcodeInsights, zipcodeInsights, setPolygons } = useZipcodeInsights();
  
    
  const handleZipcodeFilter = (text: string) => {
    const filteredZipcodes = zipcodes.filter((zipcodeData) => zipcodeData.zipcode.includes(text) || zipcodeData.name.includes(text));
    setZipcodeList(filteredZipcodes);
  };

  useDebouncedEffect(() => {
    if (searchingZipcodeText === '') {
      setZipcodeList(zipcodes);
      return;
    }

    handleZipcodeFilter(searchingZipcodeText);
  }, 300, [searchingZipcodeText]);

  useEffect(() => {
    if (zipcode === '') return;

    handleZipcodeChange();
  }, [zipcode]);

  useEffect(() => {
    if (zipcodes.length === 0) getAllZipcodes();
  }, []);

  useEffect(() => {
    if (zipcode) {
      handleGetComments(zipcode);
    }
  }, [zipcode]);
  

  const getAllZipcodes = async () => {
    Toast.show({
      type: 'info',
      text1: 'Fetching zipcodes!',
      text2: 'Please wait zipcodes are loading...',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 20,
      text1Style: { fontSize: 16, fontWeight: 'bold' },
      text2Style: { fontSize: 14 },
    });

    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      console.log('No auth tokens found.');
      return;
    }

    try {
      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch zipcode data.');

      const data = await response.json();

      setZipcodes(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })));
      setZipcodeList(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })));

      Toast.hide();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  const handleGetComments = async (zipcode: string) => {
    setLoadingComments(true);
    try {
      const data = await getComments(zipcode);  
      if (!data) return

      const comments: Comment[] = data.map((comment: Comment) => comment)
      setComments(comments)
    } catch (error) {
      console.error('Error fetching comments:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load comments',
      });
    } finally {
      setLoadingComments(false);
    }
  };

  
  const handleAddComment = async () => {
    if (!newComment.trim()) return; 
  
    setIsAddingComment(true);
    try {
      const data = await addComment(zipcode, newComment);  
      if (data) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Comment added successfully',
        });
        setNewComment('');  
        handleGetComments(zipcode);  
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to add comment',
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add comment',
      });
    } finally {
      setIsAddingComment(false);
    }
  };
  
  const handleZipcodeChange = async () => {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      console.log('No auth tokens found.');
      return;
    }

    try {
      Toast.show({
        type: 'info',
        text1: 'Fetching zipcode!',
        text2: 'Please wait zipcode is loading...',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 20,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 },
      });

      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations/${zipcode}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch zipcode data.');

      const data = await response.json();

      const coordinates = data[0].geometry.coordinates[0].map((coordinate: number[]) => ({ lat: coordinate[1], lng: coordinate[0], altitude: 150 }));
      setPolygon(convexHull(coordinates));

      const { population, medianAge, medianAgeMale, medianAgeFemale, malePop, femalePop, vacanciesForRentPercent, vacanciesForSalePercent, homeValueForecast } = data[0];
      const insights: ZipcodeInsight = {
        population,
        medianAge,
        medianAgeMale,
        medianAgeFemale,
        malePop,
        femalePop,
        vacanciesForRentPercent,
        vacanciesForSalePercent,
        homeValueForecast,
        state: '',
        city: '',
        county: '',
      };
      setZipcodeInsights(insights);

      Toast.hide();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getAuthTokens = async () => {
    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const uid = await AsyncStorage.getItem('uid');
      return { idToken, uid };
    } catch (error) {
      console.error('Error retrieving auth tokens:', error);
      throw error;
    }
  };

  const handleBackToList = () => {
    setViewingZipcodeDetails(null); 
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {viewingZipcodeDetails ? (
          <>
            {/* Back button */}
            <Pressable onPress={handleBackToList} style={styles.backButton}>
              <IconUser size={20} color="#666" />
              <Text>Back to Zipcode List</Text>
            </Pressable>

            <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
              {/* Zipcode insights */}
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Zipcode Insights</Text>
                <View style={styles.insightsGrid}>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightLabel}>Population</Text>
                    <Text style={styles.insightValue}>{zipcodeInsights.population.toLocaleString()}</Text>
                  </View>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightLabel}>Median Age</Text>
                    <Text style={styles.insightValue}>{zipcodeInsights.medianAge}</Text>
                  </View>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightLabel}>Rent Vacancies</Text>
                    <Text style={styles.insightValue}>{zipcodeInsights.vacanciesForRentPercent}%</Text>
                  </View>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightLabel}>Sale Vacancies</Text>
                    <Text style={styles.insightValue}>{zipcodeInsights.vacanciesForSalePercent}%</Text>
                  </View>
                  <View style={[styles.insightCard, styles.insightCardWide]}>
                    <Text style={styles.insightLabel}>Home Value Forecast</Text>
                    <Text style={[styles.insightValue, { color: zipcodeInsights.homeValueForecast > 0 ? '#22c55e' : '#ef4444' }]}>
                      {zipcodeInsights.homeValueForecast > 0 ? '+' : ''}{zipcodeInsights.homeValueForecast}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>Community Discussion</Text>
                
                <View style={styles.commentInputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputComment}
                      placeholder="Share your thoughts about this area..."
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#666"
                    />
                    <Pressable 
                      onPress={handleAddComment} 
                      style={[styles.addButton, !newComment.trim() && styles.addButtonDisabled]}
                      disabled={!newComment.trim() || isAddingComment}
                    >
                      {isAddingComment ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <IconSend size={20} color="#fff" />
                      )}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.commentsContainer}>
                  {loadingComments ? (
                    <View style={styles.centerContainer}>
                      <ActivityIndicator size="large" color="#007bff" />
                      <Text style={styles.loadingText}>Loading comments...</Text>
                    </View>
                  ) : comments.length === 0 ? (
                    <View style={styles.centerContainer}>
                      <Text style={styles.noCommentsText}>No comments yet</Text>
                      <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts about this area!</Text>
                    </View>
                  ) : (
                    <ScrollView 
                      showsVerticalScrollIndicator={false} 
                      contentContainerStyle={styles.commentsScrollContainer}
                    >
                      {comments.map((comment, idx) => {
                        const date = new Date(comment.created_at);
                        const timeAgo = getTimeAgo(date);

                        return (
                          <View style={styles.commentCard} key={idx}>
                            <View style={styles.commentHeader}>
                              <View style={styles.userInfo}>
                                <View style={styles.avatarContainer}>
                                  <IconUser size={20} color="#666" />
                                </View>
                                <Text style={styles.userName}>{comment.user_name}</Text>
                              </View>
                              <Text style={styles.timeAgo}>{timeAgo}</Text>
                            </View>
                            <Text style={styles.commentText}>{comment.comment}</Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={searchingZipcodeText}
              placeholder="Enter zipcode to search"
              onChangeText={(text) => setSearchingZipcodeText(text)}
            />

            <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              {zipcodeList.map((zip, idx) => (
                <Pressable
                  key={idx}
                  style={{
                    ...styles.zipcodeButton,
                    backgroundColor: zip.zipcode === zipcode ? '#e0e0e0' : '#fff',
                    gap: 20,
                  }}
                  onPress={() => {
                    setZipcode(zip.zipcode);
                    setViewingZipcodeDetails(zip.zipcode); 
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{zip.zipcode}</Text>
                    <Text>{zip.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    left: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    width: 400,
    height: '100%',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    color: '#27272a',
  },
  zipcodeButton: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
  },
  insightsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  insightCardWide: {
    minWidth: '100%',
  },
  insightLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inputComment: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 80,
    padding: 0,
  },
  addButton: {
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  addButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  commentsContainer: {
    flex: 1,
    marginTop: 20,
  },
  commentsScrollContainer: {
    gap: 16,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  noCommentsText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noCommentsSubtext: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  commentCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeAgo: {
    fontSize: 14,
    color: '#64748b',
  },
  commentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
});
