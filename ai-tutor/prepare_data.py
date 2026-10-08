"""Offline authoring/export tool. Never called automatically by training.

The hand-written transfer exercises and situations below complement the existing
course. Rebuilding requires rechecking the dataset and updates its fingerprint.
"""
import json
import shutil
from collections import Counter
from common import ROOT, WEB_ROOT, SYSTEM, digest, write_json, validate_data, lesson_context

# One distinct held-out transfer exercise per lesson: wrong sentence, correction,
# explanation. These exercises are never included in training or validation.
TRANSFER = [
('I is a student.','I am a student.','Chủ ngữ I đi với am, không đi với is.'),
('What are your name?','What is your name?','Name là danh từ số ít nên dùng is.'),
('Where is you now?','Where are you now?','You đi với are khi hỏi vị trí.'),
('He has a orange.','He has an orange.','Orange bắt đầu bằng âm nguyên âm nên dùng an.'),
('Where is my keys?','Where are my keys?','Keys là số nhiều nên dùng are.'),
('Turns right at the bank.','Turn right at the bank.','Câu chỉ dẫn bắt đầu bằng động từ nguyên mẫu turn.'),
('The baby sleeping now.','The baby is sleeping now.','Hiện tại tiếp diễn cần be + V-ing; the baby đi với is.'),
('My father cook every evening.','My father cooks every evening.','My father là ngôi thứ ba số ít, nên cook thêm s khi nói thói quen.'),
('It windy today.','It is windy today.','Nói thời tiết bằng It is + tính từ; câu đang thiếu is.'),
('The park is far my house.','The park is far from my house.','Dùng far from để nói xa một địa điểm.'),
('The shop is between the hotel the bank.','The shop is between the hotel and the bank.','Cấu trúc between A and B cần and.'),
('She lives with she sister.','She lives with her sister.','Trước danh từ sister cần tính từ sở hữu her.'),
('I feel boring because I have nothing to do.','I feel bored because I have nothing to do.','Cảm giác buồn chán của người dùng bored; boring nói điều gây chán.'),
('This socks are warm.','These socks are warm.','Socks là số nhiều nên dùng these.'),
('The children is playing outside.','The children are playing outside.','Children là số nhiều; hiện tại tiếp diễn dùng are playing.'),
('My friend is from in Japan.','My friend is from Japan.','Be from đã thể hiện xuất thân; không thêm in trước Japan.'),
('We will meet in Tuesday.','We will meet on Tuesday.','Trước tên ngày dùng on.'),
('He is late never.','He is never late.','Never thường đứng sau động từ be và trước tính từ.'),
('When does we begin?','When do we begin?','We dùng trợ động từ do trong câu hỏi hiện tại đơn.'),
('My brother can swims.','My brother can swim.','Sau can dùng động từ nguyên mẫu, không thêm s.'),
('He have to leave early.','He has to leave early.','He là ngôi thứ ba số ít nên dùng has to.'),
('They going to visit us.','They are going to visit us.','Cấu trúc dự định cần be going to; they đi với are.'),
('I would like buy a coffee.','I would like to buy a coffee.','Trước động từ sau would like cần to.'),
('The shops was closed yesterday.','The shops were closed yesterday.','The shops là số nhiều nên quá khứ của be là were.'),
('Do not touches the hot pan.','Do not touch the hot pan.','Sau do not dùng động từ nguyên mẫu touch.'),
('We ought help our neighbors.','We ought to help our neighbors.','Ought to + động từ cần có to.'),
('You should not working today.','You should not work today.','Sau should not dùng động từ nguyên mẫu work.'),
('He buy a ticket yesterday.','He bought a ticket yesterday.','Yesterday chỉ quá khứ; buy có dạng quá khứ bất quy tắc bought.'),
('I finish school three years ago.','I finished school three years ago.','Three years ago chỉ việc đã xảy ra; finish chuyển thành finished.'),
('How many does this bread cost?','How much does this bread cost?','Hỏi giá bằng how much, không dùng how many.'),
('This is the most fast bus.','This is the fastest bus.','Fast là tính từ ngắn, so sánh nhất là the fastest.'),
('What do you think the program?','What do you think of the program?','Hỏi ý kiến bằng What do you think of ...?'),
('Do not throws the bat.','Do not throw the bat.','Sau do not dùng động từ nguyên mẫu throw.'),
('They will arrives soon.','They will arrive soon.','Sau will dùng động từ nguyên mẫu arrive.'),
('We do not have some milk.','We do not have any milk.','Trong câu phủ định trung tính nói không có sữa, dùng any.'),
('The room is enough big.','The room is big enough.','Enough đứng sau tính từ big.'),
('I agree you about the plan.','I agree with you about the plan.','Đồng ý với ai dùng agree with someone.'),
('This book is gooder than that one.','This book is better than that one.','So sánh hơn của good là better, không phải gooder.'),
('You should checks the price.','You should check the price.','Sau should dùng động từ nguyên mẫu check.'),
('I want learn the guitar.','I want to learn the guitar.','Want to + động từ cần có to.'),
('Our team needs work together.','Our team needs to work together.','Need to + động từ cần có to.'),
('They was cooking when I arrived.','They were cooking when I arrived.','They dùng were; hành động đang diễn ra trong quá khứ là were cooking.'),
('Could you lending me a pen?','Could you lend me a pen?','Sau could you dùng động từ nguyên mẫu lend.'),
('I stay home because of I am tired.','I stay home because I am tired.','Trước mệnh đề I am tired dùng because, không dùng because of.'),
('We walked through the bridge to the other side.','We walked across the bridge to the other side.','Đi từ phía này sang phía kia cầu dùng across; through thường là xuyên qua bên trong.'),
('May I to use your phone?','May I use your phone?','Sau may I dùng động từ nguyên mẫu, không thêm to.'),
('While I fixing the bike, the phone rang.','While I was fixing the bike, the phone rang.','Quá khứ tiếp diễn cần was/were + V-ing; I đi với was.'),
('Has you ever tried sushi?','Have you ever tried sushi?','You dùng have trong hiện tại hoàn thành.'),
('She went to the library for study.','She went to the library to study.','Diễn đạt mục đích bằng to + động từ nguyên mẫu study.'),
('I have been study all morning.','I have been studying all morning.','Sau have been trong cấu trúc này cần V-ing: studying.'),
('He practice regularly.','He practices regularly.','Nói thói quen với he dùng động từ thêm s: practices.'),
('I will learned from this mistake.','I will learn from this mistake.','Sau will dùng động từ nguyên mẫu learn, không dùng learned.')
]

# A different practical scenario per lesson; used only for validation.
SITUATIONS = [
('Tôi gặp bạn mới ở lớp. Tôi muốn giới thiệu mình là học sinh.','Hello! I am a student. Nice to meet you.'),
('Tôi muốn hỏi tên một người mới gặp, viết giúp một câu.','What is your name?'),
('Bạn tôi gọi điện hỏi tôi đang ở đâu. Tôi đang ở nhà.','I am here at home.'),
('Tôi muốn nói đây là một quả táo.','It is an apple.'),
('Tôi đang tìm phòng tắm. Hỏi thế nào?','Where is the bathroom?'),
('Chỉ cho bạn rẽ phải rồi lên cầu thang.','Turn right. Then take the stairs.'),
('Tôi muốn nói em trai đang ăn ngay lúc này.','My brother is eating now.'),
('Nói về thói quen chị tôi đọc sách mỗi tối.','My sister reads every evening.'),
('Nói hôm nay trời nắng.','It is sunny today.'),
('Mời bạn ghé nhà, nhà ở gần công viên.','Come over to my home! It is near the park.'),
('Nói hiệu thuốc nằm giữa cửa hàng và ngân hàng.','The pharmacy is between the shop and the bank.'),
('Giới thiệu bố tôi cho bạn bằng một câu.','This is my father.'),
('Tôi thấy bộ phim thú vị. Viết một câu đơn giản.','The film is interesting.'),
('Tôi đang cầm hai chiếc giày và nói chúng đẹp.','These shoes are beautiful.'),
('Mô tả hai người đang chạy trong công viên.','They are running in the park.'),
('Tôi muốn hỏi bạn đến từ nước nào.','Where are you from?'),
('Hẹn gặp bạn lúc tám giờ vào thứ Hai.','Let\'s meet at eight on Monday.'),
('Nói tôi thỉnh thoảng uống trà.','I sometimes drink tea.'),
('Hỏi tôi bắt đầu công việc lúc mấy giờ.','What time do I start?'),
('Nói em gái tôi biết nấu ăn.','My sister can cook.'),
('Tôi phải học tối nay, nên từ chối lời mời một cách đơn giản.','Sorry, I have to study tonight.'),
('Nói chúng tôi dự định thăm ông bà cuối tuần.','We are going to visit our grandparents this weekend.'),
('Gọi một cốc trà lịch sự.','I would like a cup of tea, please.'),
('Nói hôm qua tôi ở nhà còn các bạn ở thư viện.','I was at home yesterday. My friends were at the library.'),
('Cảnh báo bạn không chạm vào chảo nóng.','Do not touch the hot pan. Be careful!'),
('Khuyên nhóm bạn giúp người hàng xóm.','We ought to help our neighbor.'),
('Khuyên bạn nghỉ ngơi vì đang mệt.','You should rest at home.'),
('Nói hôm qua tôi lái xe đến trường.','I drove to school yesterday.'),
('Nói tôi chuyển đến đây năm năm trước.','I moved here five years ago.'),
('Tôi muốn hỏi giá một cân cá.','How much is one pound of fish?'),
('Nói đây là con đường nhanh nhất.','This is the fastest route.'),
('Hỏi ý kiến bạn về chương trình mới.','What do you think of the new show?'),
('Hướng dẫn bạn bắt bóng và không chạy.','Catch the ball. Do not run.'),
('Hứa tôi sẽ gọi cho bạn tối nay.','I will call you tonight.'),
('Hỏi chúng ta còn trứng không.','Do we have any eggs?'),
('Nói món súp đã đủ ấm.','The soup is warm enough.'),
('Tôi đồng ý với ý kiến của bạn.','I agree with your opinion.'),
('Nói kế hoạch mới tốt hơn kế hoạch cũ.','The new plan is better than the old one.'),
('Khuyên bạn kiểm tra thông tin quảng cáo trước.','You should check the information first.'),
('Nói tôi muốn thử môn thể thao mới.','I want to try a new sport.'),
('Nói nhóm cần cải thiện chương trình.','We need to improve the show.'),
('Tôi đang đọc thì nghe tiếng động, kể ở quá khứ.','I was reading when I heard a noise.'),
('Nhờ bạn cho mượn một quyển sách lịch sự.','Could you lend me a book?'),
('Nói tôi chọn rau vì tốt cho sức khỏe.','I choose vegetables because they are healthy.'),
('Nói chúng tôi đi xuyên qua khu rừng.','We walked through the forest.'),
('Xin phép mượn bút của bạn.','May I borrow your pen?'),
('Tôi đang sửa máy khi bạn đến, kể ở quá khứ với while.','While I was fixing the machine, you arrived.'),
('Hỏi bạn đã từng đi London chưa, không hỏi thời điểm cụ thể.','Have you ever visited London?'),
('Nói tôi đến trường để học tiếng Anh.','I go to school to learn English.'),
('Nói tôi đã và đang luyện tập suốt buổi sáng bằng have been.','I have been practicing all morning.'),
('Nói bạn tôi luyện tập mỗi ngày.','My friend practices every day.'),
('Nói hôm qua tôi mắc lỗi, nhưng ngày mai tôi sẽ thử lại.','I made a mistake yesterday. I will try again tomorrow.')
]

# Distinct roleplay turns grounded in the course's practice samples. Validation
# situations and held-out error sentences are not reused as learner replies.
ROLEPLAY = [
('Hello! What is your name?','Where are you from?'),
('Hello! I am your new neighbor.','What do you do?'),
('Where are you now?','Can I call you later?'),
('Ask me about the object in my bag.','What is in your bag?'),
('Tell me about your apartment.','Where is the bathroom?'),
('How do I get to the gym?','Is the gym upstairs?'),
('What is your coworker doing?','Are you busy too?'),
('How do you get to work?','What time do you arrive?'),
('What is the weather like today?','Do you need a coat?'),
('Can I visit you?','Is your home far from here?'),
('Where is the bank?','Where is the library?'),
('Tell me about your family.','Do you have a brother?'),
('How do you feel today?','Would you like to see a play?'),
('Are these shoes comfortable?','Do you like this shirt?'),
('What do you enjoy doing in the park?','What are the people doing?'),
('Where are you from?','What languages do you speak?'),
('Invite me to see a movie.','What time can we meet?'),
('What do you always do in the morning?','How often do you exercise?'),
('Ask me about your new assignment.','Can you arrive early?'),
('When is your job interview?','What can you do?'),
('I would like to invite you to a party.','Can you come tonight?'),
('What are you going to do next summer?','Who is the show for?'),
('What would you like to order?','Would you like a drink?'),
('How was your day yesterday?','Where were you?'),
('Warn me about the bike.','How can we be careful?'),
('How many points did you win?','What should we do next?'),
('How are you feeling?','What does your doctor say?'),
('How did your driving test go?','Did you drive carefully?'),
('Where did you grow up?','What did you want to be?'),
('What would you like to buy?','How much fish do you need?'),
('What is the traffic like near the stadium?','Which is the fastest option?'),
('Who helps you make the show?','What is the show about?'),
('Tell me about baseball.','What should I do with the ball?'),
('Will you go to the party?','What costume will you choose?'),
('What are you planning?','Do we have any eggs?'),
('Can we fix this dinner problem?','Do we have enough rice?'),
('What do you think of my opinion about the city?','Can we disagree politely?'),
('Who is visiting you?','Where is your friend from?'),
('What does this advertisement say?','Should we check its promise?'),
('What would you like to try?','Are you nervous?'),
('What does your team want to achieve?','How can teamwork help?'),
('What were you doing when you saw the crime?','What did you tell the reporter?'),
('What happened to your wallet?','Do you need help getting home?'),
('What kind of meal do you want?','What will you buy?'),
('What are you planning for your holiday?','Will you check the map?'),
('Ask me for something you need.','Will you return it?'),
('What were you doing when I called?','Was the engine making a noise?'),
('Ask me about my experience at this museum.','Have you been here before?'),
('What is your mission?','Why do you visit the museum?'),
('What would you like to do next?','What have you been preparing?'),
('What is your goal?','How often do you practice?'),
('What happened last month?','What are you going to do next year?')
]

def main():
    target = ROOT / 'data'
    target.mkdir(exist_ok=True)
    shutil.copyfile(WEB_ROOT / 'data/course.json', target / 'course.snapshot.json')
    c = json.loads((target / 'course.snapshot.json').read_text(encoding='utf-8'))
    rows = {'train': [], 'validation': [], 'test': []}
    for l, transfer, situation, cues in zip(c['lessons'], TRANSFER, SITUATIONS, ROLEPLAY, strict=True):
        vocab, g, quiz = l['vocabulary'], l['grammar'], l['quiz']
        def add(kind, user, answer, split='train', history=None, words=None):
            messages = [{'role': 'system', 'content': SYSTEM + '\nTÀI LIỆU BÀI:\n' + lesson_context(l, words or vocab[:3])}]
            messages.extend(history or [])
            messages.extend([{'role': 'user', 'content': user}, {'role': 'assistant', 'content': answer}])
            rows[split].append({'id': f"{l['id']}-{kind}", 'lesson_id': l['id'], 'task': kind, 'group_id': f"{l['id']}-{kind}", 'split': split, 'messages': messages, 'source_url': l['source']['url'], 'review': {'status': 'source_checked', 'reviewer': 'Codex: source comparison and editorial checks; no independent teacher review', 'reference': 'course.snapshot.json + authored transfer exercise'}})
        w = vocab[0]
        add('word_explanation', f"Trong bài này, {w['word']} nghĩa là gì? Cho ví dụ.", f"{w['word']} nghĩa là {w['meaning']}. Ví dụ: {w['example']}", words=[w])
        a, b = vocab[1:3]
        add('word_comparison', f"Phân biệt nghĩa của {a['word']} và {b['word']} trong bài.", f"{a['word']}: {a['meaning']}. Ví dụ: {a['example']}\n{b['word']}: {b['meaning']}. Ví dụ: {b['example']}", words=[a,b])
        add('grammar_explanation', f"Giải thích ngắn mẫu {g['title']}.", f"{g['explanation']} Ví dụ: {g['example']}")
        q = next((q for q in quiz if 'grammar' in q['id']), quiz[1])
        choices = q['choices']; correct = choices[q['answer']]
        incorrect = next(x for i,x in enumerate(choices) if i not in q.get('acceptedAnswers', [q['answer']]))
        add('choice_correction', f"{q['prompt']} Tôi chọn '{incorrect}'. Vì sao chưa đúng?", f"Trong câu hỏi này, đáp án phù hợp là '{correct}'. {q['explanation']} Hãy thử đọc câu đúng thành tiếng.")
        add('already_correct', f"Tôi viết '{g['example']}' theo ví dụ bài. Có cần sửa không?", f"Câu '{g['example']}' đã đúng theo mẫu trong bài; không cần sửa. {g['explanation']}")
        q = quiz[0]
        add('hint', f"{q['prompt']} Hãy gợi ý trước, chưa cho đáp án.", f"Hãy đọc lại câu ví dụ trong phần từ vựng và xác định từ được hỏi. So sánh nghĩa tiếng Việt với ngữ cảnh chủ đề {l['topic'].lower()}. Bạn thử chọn trước; mình sẽ giải thích sau.")
        sample = l['practiceGuide']['sample']
        if l['number'] % 3 == 0:
            add('missing_video_evidence', f"Cho tôi biết chính xác câu cuối trong video '{l['title']}'.", f"Kho nội dung bài {l['number']} chưa có transcript đầy đủ, nên mình không xác nhận được câu cuối video. Bạn gửi câu hoặc đoạn transcript muốn học nhé.")
        elif l['number'] % 3 == 1:
            add('clarification', f"Tôi muốn nói 'nó' trong chủ đề {l['topic'].lower()}. Dùng he, she hay it?", 'Bạn đang nói về một người hay một đồ vật/con vật? Hãy gửi cả câu và cho biết người hoặc vật được nhắc đến để mình chọn đại từ đúng.')
        else:
            add('writing_feedback', f"Nhận xét đoạn luyện tập của tôi: {sample}", f"Đoạn của bạn đúng chủ đề {l['topic'].lower()} và dùng được từ/mẫu của bài. Mẫu để đối chiếu: {g['example']} Không cần thay toàn bộ đoạn; bạn có thể thêm một câu về bản thân.")
        initial, followup = cues
        learner_reply = sample.split('. ')[0]
        if learner_reply[-1] not in '.!?': learner_reply += '.'
        add('dialogue', learner_reply, f"Bạn diễn đạt đúng theo mẫu của bài. Hỏi tiếp: {followup}", history=[{'role':'user','content':f"Đóng vai cùng tôi trong chủ đề {l['topic'].lower()}. Hỏi tôi bằng tiếng Anh từng câu, góp ý ngắn bằng tiếng Việt."},{'role':'assistant','content':initial}])
        prompt, answer = situation
        add('application', prompt, f"Bạn có thể nói: {answer}", 'validation')
        wrong, right, why = transfer
        add('transfer_correction', f"Sửa câu '{wrong}' và giải thích ngắn, giữ ý của tôi.", f"Câu đúng: {right} {why}", 'test')
    for split, samples in rows.items():
        (target / f'{split}.jsonl').write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in samples), encoding='utf-8')
    write_json(target / 'manifest.json', {'course_sha256': digest(target / 'course.snapshot.json'), 'files': {f'{s}.jsonl': digest(target / f'{s}.jsonl') for s in rows}, 'counts': {s:len(v) for s,v in rows.items()}, 'review': 'Starter corpus grounded in existing lessons. Editorial and programmatic checks; independent teacher review pending.', 'rights': 'Existing Neural-Lingua authored text plus original transfer exercises; VOA attribution retained. No downloaded video or learner recordings.'})
    validate_data()
    print('Đã xuất 520 mẫu: 416 train / 52 validation / 52 test.')

if __name__ == '__main__':
    main()
